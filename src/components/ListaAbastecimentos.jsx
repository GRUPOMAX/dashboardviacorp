import {
  Box, Text, Heading, SimpleGrid, Spinner, Button, VStack,
  Badge, useDisclosure, Modal, ModalOverlay, ModalContent,
  ModalHeader, ModalCloseButton, ModalBody, Image, Wrap, WrapItem,
  HStack, Input
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
dayjs.locale('pt-br');

const NOCODB_URL = import.meta.env.VITE_NOCODB_URL;
const NOCODB_TOKEN = import.meta.env.VITE_NOCODB_TOKEN;

export default function ListaAbastecimentos() {
  const [abastecimentos, setAbastecimentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [comprovantesSelecionados, setComprovantesSelecionados] = useState([]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  useEffect(() => {
    const fetchAbastecimentos = async () => {
      setCarregando(true);
      try {
        const headers = { 'xc-token': NOCODB_TOKEN };

        const resUsers = await axios.get(`${NOCODB_URL}/api/v2/tables/msehqhsr7j040uq/records?limit=1000`, { headers });
        const mapaUsuarios = {};
        resUsers.data.list.forEach(u => {
          const nomeCompleto = `${u.first_nome ?? ''} ${u.last_nome ?? ''}`.trim();
          mapaUsuarios[u['UnicID-CPF']] = nomeCompleto || 'Usuário';
        });

        const resKm = await axios.get(`${NOCODB_URL}/api/v2/tables/m0hj8eje9k5w4c0/records?limit=1000`, { headers });
        const listaKM = resKm.data.list.flatMap(user => {
          const cpf = user['UnicID-CPF'];
          const nomeUsuario = mapaUsuarios[cpf] || 'Desconhecido';
          const semanal = user['KM-CONTROL-SEMANAL'] || {};

          return Object.entries(semanal).flatMap(([data, registros]) =>
            registros
              .filter(reg => reg?.['KM-Control']?.ABASTECEU)
              .map(reg => ({
                usuario: nomeUsuario,
                data,
                veiculo: reg['KM-Control']?.VEICULO,
                tipo: reg['KM-Control']?.TIPO_DE_ABASTECIMENTO,
                valor: reg['KM-Control']?.VALOR_ABASTECIMENTO,
                litros: reg['KM-Control']?.['TOTAL-KM_RODADO'],
                preco_litro: reg['KM-Control']?.PRECO_LITRO,
                comprovantes: [reg['KM-Control']?.['URL_IMG-KM-COMPROVANTE_ABASTECIMENTO_1'], reg['KM-Control']?.['URL_IMG-KM-COMPROVANTE_ABASTECIMENTO_2']].filter(Boolean),
                origem: 'Veículo Usuário'
              }))
          );
        });

        const resUserVehicles = await axios.get(`${NOCODB_URL}/api/v2/tables/m1sy388a4zv1kgl/records?limit=1000`, { headers });
        const abastecimentosZerado = resUserVehicles.data.list.flatMap(veiculo => {
          const cpf = veiculo['UnicID-CPF'];
          const nomeUsuario = mapaUsuarios[cpf] || 'Desconhecido';

          return (veiculo['ABASTECIMENTO-ZERADO'] || []).map(item => ({
            ...item,
            data: item.data,
            usuario: nomeUsuario,
            origem: 'Veículo Usuário'
          }));
        });

        const resStandardVehicles = await axios.get(`${NOCODB_URL}/api/v2/tables/mz92fb5ps4z32br/records?limit=1000`, { headers });
        const abastecimentosEmpresa = resStandardVehicles.data.list.flatMap(empresa =>
          (empresa.comprovante || []).map(item => ({
            ...item,
            data: item.data,
            usuario: item.responsavel || empresa['Enterprise'] || 'Empresa',
            origem: 'Veículo Empresa'
          }))
        );

        setAbastecimentos([...listaKM, ...abastecimentosZerado, ...abastecimentosEmpresa]);
      } catch (err) {
        console.error('Erro ao buscar dados de abastecimento', err);
      } finally {
        setCarregando(false);
      }
    };

    fetchAbastecimentos();
  }, []);

  const abrirComprovantes = (urls) => {
    setComprovantesSelecionados(urls || []);
    onOpen();
  };

  const filtroPorData = (item) => {
    if (!dataInicio && !dataFim) return true;
    const dataItem = dayjs(item.data, 'YYYY-MM-DD');
    const inicio = dataInicio ? dayjs(dataInicio) : null;
    const fim = dataFim ? dayjs(dataFim) : null;
    if (inicio && dataItem.isBefore(inicio, 'day')) return false;
    if (fim && dataItem.isAfter(fim, 'day')) return false;
    return true;
  };

  if (carregando) {
    return (
      <Box p={6} textAlign="center">
        <Spinner size="xl" />
        <Text mt={4}>Carregando abastecimentos...</Text>
      </Box>
    );
  }

  return (
    <Box p={6}>
      <Heading fontSize="2xl" mb={4}>Lista de Abastecimentos</Heading>

      {/* FILTRO DE DATA */}
      <HStack mb={6} spacing={4}>
        <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
        <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
      </HStack>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
        {abastecimentos.filter(filtroPorData).map((item, index) => (
          <Box
            key={index}
            p={4}
            bg="white"
            borderRadius="lg"
            boxShadow="md"
            transition="all 0.2s"
            _hover={{ boxShadow: 'lg', transform: 'scale(1.01)' }}
          >
            <VStack align="start" spacing={1} fontSize="sm">
              <Badge
                colorScheme={item.origem.includes('Empresa') ? 'blue' : 'green'}
                borderRadius="full"
                px={3}
                py={1}
                fontSize="0.75rem"
              >
                {item.origem.toUpperCase()}
              </Badge>

              <HStack spacing={2}><Text fontWeight="bold">Usuário:</Text><Text>{item.usuario}</Text></HStack>
              <HStack spacing={2}><Text fontWeight="bold">Data:</Text><Text>{dayjs(item.data).format('DD [de] MMMM [de] YYYY')}</Text></HStack>
              <HStack spacing={2}><Text fontWeight="bold">Veículo:</Text><Text>{item.veiculo}</Text></HStack>
              <HStack spacing={2}><Text fontWeight="bold">Tipo:</Text><Text>{item.tipo}</Text></HStack>
              <HStack spacing={2}><Text fontWeight="bold">Valor:</Text><Text>{item.valor}</Text></HStack>
              <HStack spacing={2}><Text fontWeight="bold">Litros:</Text><Text>{item.litros}</Text></HStack>
              <HStack spacing={2}><Text fontWeight="bold">Preço/Litro:</Text><Text>{item.preco_litro}</Text></HStack>

              {item.comprovantes?.length > 0 && (
                <Button
                  size="xs"
                  colorScheme="teal"
                  mt={2}
                  onClick={() => abrirComprovantes(item.comprovantes)}
                  variant="outline"
                >
                  Visualizar Comprovantes
                </Button>
              )}
            </VStack>
          </Box>
        ))}
      </SimpleGrid>

      {/* MODAL DE COMPROVANTES */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Comprovantes</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Wrap spacing={4} justify="center" py={2}>
              {comprovantesSelecionados.map((url, i) => (
                <WrapItem key={i}>
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    <Image
                      src={url}
                      alt={`Comprovante ${i + 1}`}
                      borderRadius="md"
                      maxH="300px"
                      _hover={{ transform: 'scale(1.05)', transition: '0.2s' }}
                    />
                  </a>

                </WrapItem>
              ))}
            </Wrap>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}
