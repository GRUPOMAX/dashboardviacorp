
import {
  Box, Spinner, Text, HStack, Switch, Select, IconButton
} from '@chakra-ui/react';
import {
  MapContainer, TileLayer, Marker, Popup, Polyline, useMap
} from 'react-leaflet';
import { Badge } from '@chakra-ui/react'; // certifique-se de importar no topo

import { Wifi, Signal, BatteryFull, Smartphone, MapPin, Network, RadioTower, PhoneCall, Info } from 'lucide-react';



import { VStack, useBreakpointValue } from '@chakra-ui/react'; // adicione


import { useEffect, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import dayjs from 'dayjs';

const NOCODB_URL = import.meta.env.VITE_NOCODB_URL;
const NOCODB_TOKEN = import.meta.env.VITE_NOCODB_TOKEN;
const INTERVALO_ONLINE_SEGUNDOS = 60;
const COORDENADA_QG = [-20.360886959602578, -40.41844432562764]; // QG




const getOperadoraIcon = (nome) => {
  const lower = nome?.toLowerCase();
  if (!lower) return <RadioTower size={14} />;
  if (lower.includes('vivo')) return <RadioTower size={14} color="#5B2DC4" />;
  if (lower.includes('claro')) return <RadioTower size={14} color="#E30613" />;
  if (lower.includes('tim')) return <RadioTower size={14} color="#0066B3" />;
  if (lower.includes('oi')) return <PhoneCall size={14} color="#FFD700" />;
  return <Network size={14} />;
};

const getRedeIcon = (tipo) => {
  const lower = tipo?.toLowerCase();
  if (!lower) return <Network size={14} />;
  if (lower.includes('wi-fi') || lower.includes('wifi')) return <Wifi size={14} color="#3182ce" />;
  if (lower.includes('dados')) return <RadioTower size={14} color="#38A169" />;
  return <Network size={14} />;
};


const getSinalIcon = (nivel) => {
  const cor = nivel >= 3 ? '#38A169' : nivel === 2 ? '#ECC94B' : '#E53E3E';
  return <Signal size={14} color={cor} />;
};

const getBateriaIcon = (nivel) => {
  const cor = nivel >= 80 ? '#38A169' : nivel >= 50 ? '#ECC94B' : '#E53E3E';
  return <BatteryFull size={14} color={cor} />;
};



const qgIcon = new L.Icon({
  iconUrl: '/car.png',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -35],
});


function RecenterMap({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}


function CustomZoomControl({ isMobile }) {
  const map = useMap();

  useEffect(() => {
    const position = isMobile ? 'bottomright' : 'topleft';

    const zoom = L.control.zoom({ position });
    zoom.addTo(map);

    if (isMobile) {
      // Aplica margem extra no mobile para não sobrepor o BottomBar
      const zoomEl = document.querySelector('.leaflet-control-zoom');
      if (zoomEl) {
        zoomEl.style.marginBottom = '70px'; // ajuste conforme a altura do seu BottomBar
        zoomEl.style.marginRight = '10px';
      }
    }

    return () => {
      zoom.remove();
    };
  }, [isMobile, map]);

  return null;
}



export default function MapaTempoReal() {
  const [posicoes, setPosicoes] = useState({});
  const [historico, setHistorico] = useState({});
  const [usuarios, setUsuarios] = useState({});
  const [carregando, setCarregando] = useState(true);
  const [modoHistorico, setModoHistorico] = useState(false);
  const [cpfSelecionado, setCpfSelecionado] = useState('');
  const [tipoMapa, setTipoMapa] = useState('mapa'); // mapa ou satelite
  const [expandido, setExpandido] = useState(false);
  const [center, setCenter] = useState(COORDENADA_QG);
  const [jaCentralizou, setJaCentralizou] = useState(false);


  const [horas, setHoras] = useState(1);

  const isMobile = useBreakpointValue({ base: true, md: false });

  useEffect(() => {
    const buscar = async () => {
      try {
        const [tempoRealRes, historicoRes, usuariosRes] = await Promise.all([
          fetch('https://api.rastreioveiculos.nexusnerds.com.br/localizacoes/tempo-real'),
          fetch('https://api.rastreioveiculos.nexusnerds.com.br/localizacoes'),
          fetch(`${NOCODB_URL}/api/v2/tables/msehqhsr7j040uq/records?fields=UnicID-CPF,picture-url,first_nome,last_nome`, {
            headers: {
              'xc-token': NOCODB_TOKEN
            }
          })
        ]);

        const tempoReal = await tempoRealRes.json();
        const historicoCompleto = await historicoRes.json();
        const usuariosData = await usuariosRes.json();

        const mapaUsuarios = {};
        usuariosData.list.forEach(user => {
          mapaUsuarios[user['UnicID-CPF']] = {
            nome: `${user.first_nome ?? ''} ${user.last_nome ?? ''}`.trim(),
            foto: user['picture-url'] || user['picture_url'] || ''
          };
        });


        setPosicoes(tempoReal);
        setHistorico(historicoCompleto);
        setUsuarios(mapaUsuarios);
        setCarregando(false);
      } catch (err) {
        console.error('Erro ao buscar dados:', err);
      }
    };

    buscar();
    const intervalo = setInterval(buscar, 5000);
    return () => clearInterval(intervalo);
  }, []);

  const usuariosOnline = Object.entries(posicoes).filter(([_, pos]) =>
    dayjs().diff(dayjs(pos.timestamp), 'second') <= INTERVALO_ONLINE_SEGUNDOS
  );


  useEffect(() => {
  if (!jaCentralizou && usuariosOnline.length > 0) {
    const { latitude, longitude } = usuariosOnline[0][1];
    setCenter([latitude, longitude]);
    setJaCentralizou(true);
  }
  }, [usuariosOnline, jaCentralizou]);

  useEffect(() => {
    if (modoHistorico && cpfSelecionado && historico[cpfSelecionado]?.length) {
      const ultima = historico[cpfSelecionado].slice(-1)[0];
      setCenter([ultima.latitude, ultima.longitude]);
    }
  }, [modoHistorico, cpfSelecionado, historico]);



  const caminhoHistorico = () => {
    if (!modoHistorico || !cpfSelecionado || !historico[cpfSelecionado]) return [];
    const limite = dayjs().subtract(horas, 'hour');
    return historico[cpfSelecionado]
      .filter(pos => dayjs(pos.timestamp).isAfter(limite))
      .map(pos => [pos.latitude, pos.longitude]);
  };

  const getCustomIcon = (cpf, modoTempoReal = true) => {
    const foto = usuarios[cpf]?.foto;
    const corBorda = modoTempoReal ? '#38A169' : '#3182ce';

    if (foto) {
      return L.divIcon({
        className: '',
        html: `<img src="${foto}" style="width:40px;height:40px;border-radius:50%;border:2px solid ${corBorda};" />`,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20]
      });
    }

    return new L.Icon({
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [0, -30],
      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
      shadowSize: [41, 41],
      className: 'leaflet-default-icon-orange'
    });
  };

  const caminho = caminhoHistorico(); 


  return (
    <Box w="100%" h="100vh" position="relative">
    <Box
    position="absolute"
    top={4}
    left={isMobile ? 4 : 'auto'}
    right={isMobile ? 4 : 4}
    zIndex={1000}
    bg="white"
    borderRadius="md"
    p={3}
    boxShadow="md"
    maxW={isMobile ? 'calc(100% - 32px)' : 'unset'}
    >
    <VStack spacing={3} align="start">
        <HStack>
        <Switch
            isChecked={modoHistorico}
            onChange={(e) => setModoHistorico(e.target.checked)}
        />
        <Text>{modoHistorico ? 'Exibir Histórico' : 'Tempo Real'}</Text>
        </HStack>

        <Select
          size="sm"
          value={tipoMapa}
          onChange={(e) => setTipoMapa(e.target.value)}
        >
          <option value="mapa">🗺️ Mapa</option>
          <option value="satelite">🛰️ Satélite</option>
        </Select>


        {modoHistorico && (
        <>
            <Select
            placeholder="Selecione um usuário"
            w="full"
            value={cpfSelecionado}
            onChange={(e) => setCpfSelecionado(e.target.value)}
            >
            {Object.entries(usuarios).map(([cpf, { nome }]) => (
                <option key={cpf} value={cpf}>{nome || cpf}</option>
            ))}
            </Select>
            <Select
            w="full"
            value={horas}
            onChange={(e) => setHoras(Number(e.target.value))}
            >
            {[1, 2, 4, 6, 12, 24].map(h => (
                <option key={h} value={h}>{h}h</option>
            ))}
            </Select>
        </>
        )}
    </VStack>
    </Box>


      {/* ✅ Mensagem se ninguém estiver online */}
      {!modoHistorico && usuariosOnline.length === 0 && (
        <Box position="absolute" top="80px" left="50%" transform="translateX(-50%)" zIndex={999}>
          <Text bg="red.50" color="red.500" px={4} py={2} borderRadius="md" fontWeight="medium">
            Nenhum usuário online neste momento.
          </Text>
        </Box>
      )}

      {carregando ? (
        <Spinner size="xl" position="absolute" top="50%" left="50%" />
      ) : (
        <MapContainer center={center} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={false}>
          <TileLayer
              url={
                tipoMapa === 'satelite'
                  ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
                  : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
              }
            />

          <RecenterMap center={center} />
          <CustomZoomControl isMobile={isMobile} />


        <Marker position={COORDENADA_QG} icon={qgIcon}>
        <Popup>
            <Text fontWeight="bold">📍 Base Central (QG)</Text>
        </Popup>
        </Marker>


          {/* ✅ Tempo real: apenas online */}
          {!modoHistorico && usuariosOnline.map(([cpf, { latitude, longitude, timestamp }]) => (
            <Marker key={cpf} position={[latitude, longitude]} icon={getCustomIcon(cpf, true)}>
              <Popup>
                <Box p={1.5} bg="white" borderRadius="md" minW="200px" fontSize="xs" lineHeight="1.2">
                  <HStack justify="space-between" mb={1}>
                    <Text fontWeight="bold" fontSize="sm" color="gray.800">
                      {usuarios[cpf]?.nome || 'Desconhecido'}
                    </Text>
                    <IconButton
                      icon={<Info size={14} />}
                      size="xs"
                      variant="ghost"
                      onClick={() => setExpandido(!expandido)}
                      aria-label="Ver mais"
                    />
                  </HStack>

                  <VStack spacing={0.5} align="start">
                    <HStack spacing={1}><Smartphone size={12} /><Text>CPF: {cpf}</Text></HStack>
                    <HStack spacing={1}><MapPin size={12} /><Text>Verificação: {new Date(timestamp).toLocaleTimeString('pt-BR')}</Text></HStack>

                    <HStack spacing={1}>
                      {getRedeIcon(posicoes[cpf]?.rede)}
                      <Text>{posicoes[cpf]?.rede || '-'}</Text>
                    </HStack>

                    {expandido && (
                      <>
                        <HStack spacing={1}>
                          <Smartphone size={12} />
                          <Text>{posicoes[cpf]?.dispositivo || '-'}</Text>
                        </HStack>

                        <HStack spacing={1}>
                          {getOperadoraIcon(posicoes[cpf]?.operadora)}
                          <Text>{posicoes[cpf]?.operadora || '-'}</Text>
                        </HStack>

                        <HStack spacing={1}>
                          {getSinalIcon(posicoes[cpf]?.sinal)}
                          <Text>Sinal: {posicoes[cpf]?.sinal} / 4</Text>
                        </HStack>

                        <HStack spacing={1}>
                          {getBateriaIcon(posicoes[cpf]?.bateria)}
                          <Text>Bateria: {posicoes[cpf]?.bateria}%</Text>
                        </HStack>
                      </>
                    )}
                  </VStack>

                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      color: '#2E9606',
                      fontSize: '0.7rem',
                      fontWeight: '500',
                      display: 'inline-block',
                      marginTop: '6px'
                    }}
                  >
                    📍 Ver no Google Maps
                  </a>
                </Box>
              </Popup>




            </Marker>
          ))}

          {/* ✅ Histórico */}
        {modoHistorico && caminho.length > 0 && (
        <>
            <Marker
            position={caminho[caminho.length - 1]}
            icon={getCustomIcon(cpfSelecionado, false)}
            >
            <Popup>
                <Text><strong>Nome:</strong> {usuarios[cpfSelecionado]?.nome || cpfSelecionado}</Text>
                <a
                href={`https://www.google.com/maps/search/?api=1&query=${caminho[caminho.length - 1].join(',')}`}
                target="_blank"
                rel="noreferrer"
                style={{ color: '#3182ce', textDecoration: 'underline' }}
                >
                Ver no Google Maps
                </a>
            </Popup>
            </Marker>

            <Polyline positions={caminho} color="blue" />
        </>
        )}
        </MapContainer>
      )}
    </Box>
  );
}
