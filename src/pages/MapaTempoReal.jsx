
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
const casaIcon = new L.Icon({
  iconUrl: '/casa.png',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36]
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
  const [trajetosTempoReal, setTrajetosTempoReal] = useState({});
  const [velocidades, setVelocidades] = useState({});




  const [horas, setHoras] = useState(1);

  const isMobile = useBreakpointValue({ base: true, md: false });

useEffect(() => {
  const fetchWithRetry = async (url, options = {}, attempt = 1, maxAttempts = 3) => {
    try {
      const res = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(30000),
        headers: { ...options.headers, 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} - ${res.statusText}`);
      const data = await res.json();
      console.log(`Resposta de ${url}:`, data);
      return data;
    } catch (err) {
      console.error(`Erro ao buscar ${url} (tentativa ${attempt}): ${err.message}`);
      if (attempt < maxAttempts) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`Retry após ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchWithRetry(url, options, attempt + 1, maxAttempts);
      }
      throw err;
    }
  };

  const buscar = async () => {
    setCarregando(true);
    try {
      const [tempoRealRes, historicoRes, usuariosRes] = await Promise.all([
        fetchWithRetry('https://api.rastreioveiculos.nexusnerds.com.br/localizacoes/tempo-real'),
        fetchWithRetry('https://api.rastreioveiculos.nexusnerds.com.br/localizacoes'),
        fetchWithRetry(`${NOCODB_URL}/api/v2/tables/msehqhsr7j040uq/records?fields=UnicID-CPF,picture-url,first_nome,last_nome,casa-coordenadas`, {
          headers: { 'xc-token': NOCODB_TOKEN },
        }),
      ]);

      // Validação dos dados
      if (!tempoRealRes || typeof tempoRealRes !== 'object') {
        console.error('Dados de tempo real inválidos:', tempoRealRes);
        throw new Error('Resposta de tempo real inválida');
      }
      if (!historicoRes || typeof historicoRes !== 'object') {
        console.error('Dados de histórico inválidos:', historicoRes);
        throw new Error('Resposta de histórico inválida');
      }
      if (!usuariosRes?.list || !Array.isArray(usuariosRes.list)) {
        console.error('Dados de usuários inválidos:', usuariosRes);
        throw new Error('Resposta de usuários inválida');
      }

      const mapaUsuarios = {};
      usuariosRes.list.forEach(user => {
        if (user['UnicID-CPF']) {
          mapaUsuarios[user['UnicID-CPF']] = {
            nome: `${user.first_nome ?? ''} ${user.last_nome ?? ''}`.trim(),
            foto: user['picture-url'] || user['picture_url'] || '',
            casa: user['casa-coordenadas'] || null,
          };
        }
      });

      setPosicoes(tempoRealRes);
      setHistorico(historicoRes);
      setUsuarios(mapaUsuarios);
      setCarregando(false);
    } catch (err) {
      console.error('Erro ao buscar dados:', err);
      setCarregando(true); // Mantém carregando até sucesso
    }
  };

  buscar();
  const intervalo = setInterval(buscar, 15000); // Aumentado para 15 segundos
  return () => clearInterval(intervalo);
}, []);

  const usuariosOnline = Object.entries(posicoes).filter(([_, pos]) =>
    dayjs().diff(dayjs(pos.timestamp), 'second') <= INTERVALO_ONLINE_SEGUNDOS
  );

  useEffect(() => {
    setTrajetosTempoReal(prev => {
      const novo = { ...prev };
      const novasVelocidades = {};

      for (const [cpf, { latitude, longitude }] of Object.entries(posicoes)) {
        if (!novo[cpf]) novo[cpf] = [];
        novo[cpf].push([latitude, longitude]);

        // limita o histórico por CPF
        if (novo[cpf].length > 200) novo[cpf].shift();

        // cálculo de velocidade baseado nos 2 últimos pontos
        const coords = novo[cpf];
        if (coords.length >= 2) {
          const [lat1, lon1] = coords[coords.length - 2];
          const [lat2, lon2] = coords[coords.length - 1];
          const distanciaKm = calcularDistanciaKm(lat1, lon1, lat2, lon2);
          const tempoSegundos = 5;
          const velocidade = (distanciaKm / tempoSegundos) * 3600; // km/h
          novasVelocidades[cpf] = velocidade;
        }
      }

      setVelocidades(novasVelocidades);
      return novo;
    });
  }, [posicoes]);




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

  const calcularDistanciaKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // raio da Terra em km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};


  // Simula um "antPath" básico
  useEffect(() => {
    const interval = setInterval(() => {
      setTrajetosTempoReal((prev) => {
        const novo = {};
        Object.entries(prev).forEach(([cpf, coords]) => {
          if (coords.length > 1) {
            novo[cpf] = [...coords.slice(1), coords[0]]; // desloca a linha
          } else {
            novo[cpf] = coords;
          }
        });
        return novo;
      });
    }, 3000); // ciclo da "animação"
    return () => clearInterval(interval);
  }, []);



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

          <Select
            placeholder={modoHistorico ? "Usuário (histórico)" : "Usuário (trajeto ao vivo)"}
            value={cpfSelecionado}
            onChange={(e) => setCpfSelecionado(e.target.value)}
            size="sm"
          >
            <option value="todos">Todos</option>
            {Object.entries(usuarios).map(([cpf, { nome }]) => (
              <option key={cpf} value={cpf}>{nome || cpf}</option>
            ))}
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
        {!modoHistorico && (
          <Box w="full">
            <IconButton
              colorScheme="red"
              size="sm"
              variant="outline"
              w="full"
              icon={<svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 512 512"><path fill="currentColor" d="M432 32H320l-32-32H224l-32 32H80C53.49 32 32 53.49 32 80v48h448V80c0-26.51-21.49-48-48-48zm16 96H64v336c0 26.51 21.49 48 48 48h288c26.51 0 48-21.49 48-48V128z"/></svg>}
              aria-label="Limpar rastros"
              onClick={() => setTrajetosTempoReal({})}
            />
          </Box>
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
            <Text fontWeight="bold">📍 Quartel General (QG)</Text>
        </Popup>
        </Marker>


          {/* ✅ Tempo real: apenas online */}
          {!modoHistorico && usuariosOnline.map(([cpf, { latitude, longitude, timestamp }]) => {
              const trajeto = trajetosTempoReal[cpf] || [];
              const velocidade = velocidades[cpf];

              if (trajeto.length >= 2) {
                const [lat1, lon1] = trajeto[trajeto.length - 2];
                const [lat2, lon2] = trajeto[trajeto.length - 1];
                const distanciaKm = calcularDistanciaKm(lat1, lon1, lat2, lon2);
                const tempoSegundos = 5;
                const velocidade = velocidades[cpf];
              }


            return (
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

                        {typeof velocidade === 'number' && !isNaN(velocidade) && (
                          <HStack spacing={1}>
                            <Text>🚗 Velocidade:</Text>
                            <Text fontWeight="bold" color="blue.600">{velocidade.toFixed(1)} km/h</Text>
                          </HStack>
                        )}


                      {expandido && (
                        <>
                          <HStack spacing={1}><Smartphone size={12} /><Text>{posicoes[cpf]?.dispositivo || '-'}</Text></HStack>
                          <HStack spacing={1}>{getOperadoraIcon(posicoes[cpf]?.operadora)}<Text>{posicoes[cpf]?.operadora || '-'}</Text></HStack>
                          <HStack spacing={1}>{getSinalIcon(posicoes[cpf]?.sinal)}<Text>Sinal: {posicoes[cpf]?.sinal} / 4</Text></HStack>
                          <HStack spacing={1}>{getBateriaIcon(posicoes[cpf]?.bateria)}<Text>Bateria: {posicoes[cpf]?.bateria}%</Text></HStack>
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
            );
          })}


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



        
      {!modoHistorico && Object.entries(trajetosTempoReal).map(([cpf, coords]) => {
        if (cpfSelecionado !== 'todos' && cpfSelecionado !== cpf) return null;
        if (coords.length < 2) return null;

        return (
          <Polyline key={cpf} positions={coords} color="green" />
        );
      })}

      

        {Object.entries(usuarios).map(([cpf, user]) => {
            if (!user?.casa) return null;

            const [lat, lng] = user.casa.split(',').map(Number);
            if (isNaN(lat) || isNaN(lng)) return null;

            return (
              <Marker key={`casa-${cpf}`} position={[lat, lng]} icon={casaIcon}>
                <Popup>
                  <Text fontWeight="bold">🏠 Casa de {user.nome}</Text>
                  <Text fontSize="xs">({lat.toFixed(5)}, {lng.toFixed(5)})</Text>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#2B6CB0', fontSize: '0.7rem' }}
                  >
                    Ver no Google Maps
                  </a>
                </Popup>
              </Marker>
            );
          })}

        </MapContainer>
      )}

    </Box>
  );
}
