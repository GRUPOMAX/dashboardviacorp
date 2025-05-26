import {
  Box, Heading, SimpleGrid, Stat, StatLabel, StatNumber, StatHelpText,
  Spinner, Progress, Text, VStack, HStack, Icon, useDisclosure, Divider, Badge, IconButton,
  Input, Select, FormControl, FormLabel
} from '@chakra-ui/react';
import { Tooltip } from '@chakra-ui/react'; // ✅ Certifique-se que está importado

import { FiDroplet, FiEdit } from 'react-icons/fi';
import { useEffect, useState } from 'react';
import ModalUltimosAbastecimentos from '../components/ModalUltimosAbastecimentos';
import ModalEditarVeiculo from '../components/ModalEditarVeiculo';
import { useRequisicoesAbastecimento } from '../services/useRequisicoesAbastecimento';
import { useFiltrosAbastecimento } from '../services/useFiltrosAbastecimento';

export default function PainelAbastecimento() {
  const [veiculoSelecionado, setVeiculoSelecionado] = useState(null);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [modoCalculo, setModoCalculo] = useState('todos');
  const { isOpen, onOpen, onClose } = useDisclosure();
  


  const { registros, veiculosUsuario, veiculosEmpresa, carregando, updateTrigger  } = useRequisicoesAbastecimento();

  const [filtros, setFiltros] = useState({
    litrosVeiculosUsuarioNoPeriodo: [],
    litrosVeiculosEmpresaNoPeriodo: [],
    totalAbastecimentos: 0,
    totalLitros: 0,
    litrosPorVeiculo: {}
  });

  useEffect(() => {
    const {
      litrosVeiculosUsuarioNoPeriodo,
      litrosVeiculosEmpresaNoPeriodo,
      totalAbastecimentos,
      totalLitros,
      litrosPorVeiculo
    } = useFiltrosAbastecimento(registros, veiculosUsuario, veiculosEmpresa, dataInicio, dataFim);

    setFiltros({
      litrosVeiculosUsuarioNoPeriodo,
      litrosVeiculosEmpresaNoPeriodo,
      totalAbastecimentos,
      totalLitros,
      litrosPorVeiculo
    });
  }, [registros, veiculosUsuario, veiculosEmpresa, dataInicio, dataFim, updateTrigger]); // ✅ aqui

  const abrirModal = (veiculo, tipo) => {
    setVeiculoSelecionado({ veiculo, tipo });
    setModoEdicao(false);
    onOpen();
  };

  const abrirModalEdicao = (veiculo, tipo) => {
    setVeiculoSelecionado({ veiculo, tipo });
    setModoEdicao(true);
    onOpen();
  };

  const renderTanque = (litros, maxLitros = 60, performance = 0) => {
    const percentual = (litros / maxLitros) * 100;
    const cor = percentual >= 70 ? 'green' : percentual > 30 ? 'yellow' : 'red';
    const status = percentual >= 70 ? 'Cheio' : percentual > 30 ? 'Médio' : 'Baixo';
    const kmPossivel = performance > 0 ? (litros * performance).toFixed(0) : '-';

    return (
      <VStack align="start" spacing={1} mt={3}>
        <Text fontSize="xs" fontWeight="medium" color="gray.600">
          Nível do Tanque: <Badge colorScheme={cor}>{status}</Badge>
        </Text>
        <Progress value={percentual} colorScheme={cor} w="100%" borderRadius="lg" />
        <HStack spacing={2}>
          <Text fontSize="xs" color="gray.500">{litros.toFixed(2)} L</Text>
              {performance > 0 && (
                <Tooltip
                  label={`Cálculo: ${litros.toFixed(2)} L × ${performance} km/L = ${kmPossivel} km`}
                  aria-label="Resumo do cálculo"
                  hasArrow
                  placement="top"
                  bg="gray.700"
                  color="white"
                  fontSize="xs"
                >
                  <Text fontSize="xs" color="gray.500" cursor="help">
                    ≈ {kmPossivel} km restantes
                  </Text>
                </Tooltip>
              )}
        </HStack>
      </VStack>
    );
  };


  const CardVeiculo = ({ nome, litros, maxLitros, performance, onClick, onEditar }) => (
    <Box p={4} borderRadius="2xl" bgGradient="linear(to-r, white, gray.50)" boxShadow="sm" border="1px solid" borderColor="gray.200" transition="all 0.2s" w="100%">
      <HStack spacing={4} align="start" flexWrap="wrap">
        <Box bg="blue.100" w="42px" h="42px" display="flex" alignItems="center" justifyContent="center" borderRadius="full" flexShrink={0}>
          <Icon as={FiDroplet} color="blue.600" boxSize={5} />
        </Box>
        <VStack align="start" spacing={0} flex={1} onClick={onClick} cursor="pointer" wordBreak="break-word">
          <Text fontWeight="semibold" fontSize="md">{nome}</Text>
          {renderTanque(Number(litros), Number(maxLitros || 60), Number(performance || 0))}
        </VStack>
        <IconButton size="sm" icon={<FiEdit />} colorScheme="blue" variant="ghost" aria-label="Editar Veículo" onClick={onEditar} />
      </HStack>
    </Box>
  );


  const {
    litrosVeiculosUsuarioNoPeriodo,
    litrosVeiculosEmpresaNoPeriodo,
    totalAbastecimentos,
    totalLitros,
    litrosPorVeiculo
  } = filtros;

  return (
    <Box>
      <Heading size="lg" mb={6}>Painel de Abastecimento</Heading>

      <HStack spacing={4} mb={6}>
        <FormControl>
          <FormLabel>Data Início</FormLabel>
          <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
        </FormControl>
        <FormControl>
          <FormLabel>Data Fim</FormLabel>
          <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
        </FormControl>
        <FormControl>
          <FormLabel>Modo de Cálculo</FormLabel>
          <Select value={modoCalculo} onChange={(e) => setModoCalculo(e.target.value)}>
            <option value="todos">Todos os Abastecimentos</option>
            <option value="porVeiculo">Por Veículo</option>
          </Select>
        </FormControl>
      </HStack>

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
              <StatNumber color="blue.700">{modoCalculo === 'todos' ? totalLitros.toFixed(2) : '-'}</StatNumber>
              <StatHelpText>Registrados</StatHelpText>
            </Stat>
          </SimpleGrid>

          {modoCalculo === 'porVeiculo' && (
            <>
              <Heading size="md" mb={4}>Litros por Veículo</Heading>
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={6}>
                {Object.entries(litrosPorVeiculo).map(([veiculo, litros]) => (
                  <Stat key={veiculo} p={5} bg="white" borderRadius="lg" boxShadow="sm">
                    <StatLabel fontSize="sm" color="gray.600">{veiculo}</StatLabel>
                    <StatNumber color="blue.700">{litros.toFixed(2)} L</StatNumber>
                  </Stat>
                ))}
              </SimpleGrid>
            </>
          )}

          <Divider my={6} />
          <Heading size="md" mb={4}>Veículos Agregados</Heading>
          <SimpleGrid columns={{ base: 1, sm: 1, md: 2 }} spacing={4} mb={10}>
            {litrosVeiculosUsuarioNoPeriodo.map((v, i) => (
              <CardVeiculo
                key={i}
                nome={v['MODEL-VEHICLE']}
                litros={v.litrosPeriodo}
                maxLitros={v['LITROS-MAXIMO'] || 60}
                performance={v['KM-PERFORMACE'] || 0} // novo
                onClick={() => abrirModal(v['MODEL-VEHICLE'], 'usuario')}
                onEditar={() => abrirModalEdicao(v, 'usuario')}
              />
            ))}
          </SimpleGrid>

          <Divider my={6} />
          <Heading size="md" mb={4}>Veículos da Empresa</Heading>
          <SimpleGrid columns={{ base: 1, sm: 1, md: 2 }} spacing={4}>
            {litrosVeiculosEmpresaNoPeriodo.map((veic, i) => (
              <CardVeiculo
                key={`empresa-${i}`}
                nome={veic.veiculo}
                litros={veic.litrosPeriodo}
                maxLitros={Number(veic['LITROS-MAXIMO'])}
                performance={veic['KM-PERFORMACE'] || 0} // ✅ ADICIONE ESTA LINHA
                onClick={() => abrirModal(veic.veiculo, 'empresa')}
                onEditar={() => abrirModalEdicao(veic, 'empresa')}
              />
            ))}
          </SimpleGrid>


          {!modoEdicao ? (
            <ModalUltimosAbastecimentos isOpen={isOpen} onClose={onClose} veiculo={veiculoSelecionado?.veiculo} tipo={veiculoSelecionado?.tipo} />
          ) : (
            <ModalEditarVeiculo isOpen={isOpen} onClose={onClose} dados={veiculoSelecionado?.veiculo} tipo={veiculoSelecionado?.tipo} />
          )}
        </>
      )}
    </Box>
  );
}
