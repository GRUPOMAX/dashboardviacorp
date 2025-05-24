import {
  Box, Spinner, Text, HStack, Switch, Select
} from '@chakra-ui/react';
import {
  MapContainer, TileLayer, Marker, Popup, Polyline, useMap
} from 'react-leaflet';
import { Badge } from '@chakra-ui/react'; // certifique-se de importar no topo

import { useEffect, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import dayjs from 'dayjs';

const NOCODB_URL = import.meta.env.VITE_NOCODB_URL;
const NOCODB_TOKEN = import.meta.env.VITE_NOCODB_TOKEN;
const INTERVALO_ONLINE_SEGUNDOS = 60;
const COORDENADA_QG = [-20.360886959602578, -40.41844432562764]; // QG


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

export default function MapaTempoReal() {
  const [posicoes, setPosicoes] = useState({});
  const [historico, setHistorico] = useState({});
  const [usuarios, setUsuarios] = useState({});
  const [carregando, setCarregando] = useState(true);
  const [modoHistorico, setModoHistorico] = useState(false);
  const [cpfSelecionado, setCpfSelecionado] = useState('');
  const [horas, setHoras] = useState(1);

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
            nome: `${user.first_nome ?? ''} ${user.last_nome ?? ''}`,
            foto: user['picture-url']
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

  const center = (() => {
    if (modoHistorico && cpfSelecionado && historico[cpfSelecionado]?.length) {
      const ultima = historico[cpfSelecionado].slice(-1)[0];
      return [ultima.latitude, ultima.longitude];
    }
    if (usuariosOnline.length > 0) {
      const { latitude, longitude } = usuariosOnline[0][1];
      return [latitude, longitude];
    }
    return COORDENADA_QG;
  })();

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

  const caminho = caminhoHistorico(); // ✅ Definido apenas uma vez


  return (
    <Box w="100%" h="100vh" position="relative">
        <HStack
        position="absolute" top={4} right={4} zIndex={1000}
        bg="white" borderRadius="md" p={3} boxShadow="md" spacing={4}
        align="center"
        >

        <Switch isChecked={modoHistorico} onChange={e => setModoHistorico(e.target.checked)} />
        <Text>{modoHistorico ? 'Exibir Histórico' : 'Tempo Real'}</Text>

        {modoHistorico && (
          <>
            <Select placeholder="Selecione um usuário" w="200px" value={cpfSelecionado} onChange={(e) => setCpfSelecionado(e.target.value)}>
              {Object.entries(usuarios).map(([cpf, { nome }]) => (
                <option key={cpf} value={cpf}>{nome || cpf}</option>
              ))}
            </Select>
            <Select w="100px" value={horas} onChange={(e) => setHoras(Number(e.target.value))}>
              {[1, 2, 4, 6, 12, 24].map(h => (
                <option key={h} value={h}>{h}h</option>
              ))}
            </Select>
          </>
        )}
      </HStack>

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
        <MapContainer center={center} zoom={15} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <RecenterMap center={center} />


        <Marker position={COORDENADA_QG} icon={qgIcon}>
        <Popup>
            <Text fontWeight="bold">📍 Base Central (QG)</Text>
        </Popup>
        </Marker>


          {/* ✅ Tempo real: apenas online */}
          {!modoHistorico && usuariosOnline.map(([cpf, { latitude, longitude, timestamp }]) => (
            <Marker key={cpf} position={[latitude, longitude]} icon={getCustomIcon(cpf, true)}>
              <Popup>
                <Text><strong>Nome:</strong> {usuarios[cpf]?.nome || 'Desconhecido'}</Text>
                <Text><strong>CPF:</strong> {cpf}</Text>
                {(() => {
                    const diffSeg = dayjs().diff(dayjs(timestamp), 'second');
                    const estaOnline = diffSeg <= 5;

                    return (
                        <HStack mt={2} mb={2}>
                        <Text><strong>Status:</strong></Text>
                        <Badge
                            colorScheme={estaOnline ? 'green' : 'gray'}
                            variant="solid"
                            borderRadius="full"
                            px={2}
                            py={0.5}
                            fontSize="0.75rem"
                        >
                            {estaOnline ? 'Online' : 'Offline'}
                        </Badge>
                        </HStack>
                    );
                    })()}

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: '#3182ce', textDecoration: 'underline' }}
                >
                  Ver no Google Maps
                </a>
                <Text fontSize="sm" mt={1}>
                  Última atualização: {new Date(timestamp).toLocaleString('pt-BR')}
                </Text>
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
