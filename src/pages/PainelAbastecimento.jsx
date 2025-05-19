import {
  Box, Heading, SimpleGrid, Stat, StatLabel, StatNumber, StatHelpText,
  Spinner, Progress, Text, VStack, HStack, Icon, useDisclosure, Divider, Badge, IconButton
} from '@chakra-ui/react';
import { FiDroplet, FiEdit } from 'react-icons/fi';
import { useEffect, useState } from 'react';
import { listarRegistrosKm, listarVeiculos, listarVeiculosEmpresa } from '../services/api';
import ModalUltimosAbastecimentos from '../components/ModalUltimosAbastecimentos';
import ModalEditarVeiculo from '../components/ModalEditarVeiculo';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
dayjs.locale('pt-br');

export default function PainelAbastecimento() {
  const [registros, setRegistros] = useState([]);
  const [veiculosUsuario, setVeiculosUsuario] = useState([]);
  const [veiculosEmpresa, setVeiculosEmpresa] = useState([]);
  const [veiculoSelecionado, setVeiculoSelecionado] = useState(null);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    const carregar = async () => {
      try {
        const [km, userVeiculos, empresaVeiculos] = await Promise.all([
          listarRegistrosKm(),
          listarVeiculos(),
          listarVeiculosEmpresa()
        ]);
        setRegistros(km);
        setVeiculosUsuario(userVeiculos);
        setVeiculosEmpresa(empresaVeiculos);
      } catch (err) {
        console.error('Erro ao carregar dados do painel:', err);
      } finally {
        setCarregando(false);
      }
    };

    carregar();
    const intervalo = setInterval(() => carregar(), 1000);
    return () => clearInterval(intervalo);
  }, []);

  const totalAbastecimentos = registros.flatMap(r =>
    Object.values(r['KM-CONTROL-SEMANAL'] || {})
  ).flat().filter(item => item?.['KM-Control']?.ABASTECEU).length;

  const totalLitros = registros.flatMap(r =>
    Object.values(r['KM-CONTROL-SEMANAL'] || {})
  ).flat().reduce((total, item) => {
    const litros = item?.['KM-Control']?.LITROS_ABASTECIDOS || 0;
    return total + Number(litros);
  }, 0);

  const abrirModal = (veiculo, tipo) => {
    setVeiculoSelecionado({ veiculo, tipo });
    setModoEdicao(false);
    onOpen();
  };

  const abrirModalEdicao = (veiculo) => {
    setVeiculoSelecionado({ veiculo });
    setModoEdicao(true);
    onOpen();
  };

  const renderTanque = (litros, maxLitros = 60) => {
    const percentual = (litros / maxLitros) * 100;
    const cor = percentual >= 70 ? 'green' : percentual > 30 ? 'yellow' : 'red';
    const status = percentual >= 70 ? 'Cheio' : percentual > 30 ? 'Médio' : 'Baixo';

    return (
      <VStack align="start" spacing={1} mt={3}>
        <Text fontSize="xs" fontWeight="medium" color="gray.600">
          Nível do Tanque: <Badge colorScheme={cor}>{status}</Badge>
        </Text>
        <Progress value={percentual} colorScheme={cor} w="100%" borderRadius="lg" />
        <Text fontSize="xs" color="gray.500">{litros.toFixed(2)} L</Text>
      </VStack>
    );
  };

  const CardVeiculo = ({ nome, litros, maxLitros, onClick, onEditar }) => (
    <Box
      p={4}
      borderRadius="2xl"
      bgGradient="linear(to-r, white, gray.50)"
      boxShadow="sm"
      border="1px solid"
      borderColor="gray.200"
      transition="all 0.2s"
    >
      <HStack spacing={4} align="start">
        <Box
          bg="blue.100"
          w="42px"
          h="42px"
          display="flex"
          alignItems="center"
          justifyContent="center"
          borderRadius="full"
        >
          <Icon as={FiDroplet} color="blue.600" boxSize={5} />
        </Box>
        <VStack align="start" spacing={0} flex={1} onClick={onClick} cursor="pointer">
          <Text fontWeight="semibold" fontSize="md">{nome}</Text>
          {renderTanque(Number(litros), Number(maxLitros || 60))}
        </VStack>
        <IconButton
          size="sm"
          icon={<FiEdit />}
          colorScheme="blue"
          variant="ghost"
          aria-label="Editar Veículo"
          onClick={onEditar}
        />
      </HStack>
    </Box>
  );

  return (
    <Box>
      <Heading size="lg" mb={6}>Painel de Abastecimento</Heading>

      {carregando ? (
        <Spinner size="xl" color="blue.500" />
      ) : (
        <>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={6}>
            <Stat p={5} bg="white" borderRadius="lg" boxShadow="sm">
              <StatLabel fontSize="sm" color="gray.600">Total de Abastecimentos</StatLabel>
              <StatNumber color="blue.700">{totalAbastecimentos}</StatNumber>
              <StatHelpText>Desde o início</StatHelpText>
            </Stat>

            <Stat p={5} bg="white" borderRadius="lg" boxShadow="sm">
              <StatLabel fontSize="sm" color="gray.600">Total de Litros</StatLabel>
              <StatNumber color="blue.700">{totalLitros.toFixed(2)} L</StatNumber>
              <StatHelpText>Registrados</StatHelpText>
            </Stat>
          </SimpleGrid>

          <Divider my={6} />
          <Heading size="md" mb={4}>Veículos do Usuário</Heading>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={10}>
            {veiculosUsuario.map((v, i) => (
              <CardVeiculo
                key={i}
                nome={v['MODEL-VEHICLE']}
                litros={v['ABASTECIMENTO-DISPONIVELE-LITRO']}
                maxLitros={v['LITROS-MAXIMO']}
                onClick={() => abrirModal(v['MODEL-VEHICLE'], 'usuario')}
                onEditar={() => abrirModalEdicao(v)}
              />
            ))}
          </SimpleGrid>

          <Divider my={6} />
          <Heading size="md" mb={4}>Veículos da Empresa</Heading>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            {veiculosEmpresa.flatMap((v, idx) => {
              let lista = v['Vehicle-Standard'];
              if (typeof lista === 'string') {
                try {
                  lista = JSON.parse(lista);
                } catch (e) {
                  console.error('Erro ao parsear Vehicle-Standard', e);
                  return [];
                }
              }

              return (lista || []).map((veic, i) => (
                <CardVeiculo
                  key={`${idx}-${i}`}
                  nome={veic.veiculo}
                  litros={veic['ABASTECIMENTO-DISPONIVELE-LITRO']}
                  maxLitros={veic['LITROS-MAXIMO']}
                  onClick={() => abrirModal(veic.veiculo, 'empresa')}
                  onEditar={() => abrirModalEdicao(veic)}
                />
              ));
            })}
          </SimpleGrid>

          {!modoEdicao ? (
            <ModalUltimosAbastecimentos
              isOpen={isOpen}
              onClose={onClose}
              veiculo={veiculoSelecionado?.veiculo}
              tipo={veiculoSelecionado?.tipo}
            />
          ) : (
            <ModalEditarVeiculo
              isOpen={isOpen}
              onClose={onClose}
              dados={veiculoSelecionado?.veiculo}
              tipo={veiculoSelecionado?.tipo}
            />
          )}
        </>
      )}
    </Box>
  );
}