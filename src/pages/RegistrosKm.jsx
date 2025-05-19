import { useEffect, useState } from 'react';
import {
  Box, Heading, Table, Thead, Tbody, Tr, Th, Td,
  Spinner, Text, Badge, Icon, Select, Input, HStack
} from '@chakra-ui/react';
import ModalGerarRelatorio from '../components/ModalGerarRelatorio';
import { Button } from '@chakra-ui/react';
import { listarRegistrosKm, listarUsuarios, listarVeiculos } from '../services/api'; // Adicionar listarVeiculos
import dayjs from 'dayjs';
import {
  FiCalendar, FiUser, FiTruck, FiMap, FiDroplet, FiDollarSign
} from 'react-icons/fi';
import ModalDetalhesKm from '../components/ModalDetalhesKm';
import { useDisclosure } from '@chakra-ui/react';
import 'dayjs/locale/pt-br';
dayjs.locale('pt-br');

export default function RegistrosKm() {
  const [registros, setRegistros] = useState([]);
  const [veiculos, setVeiculos] = useState([]); // Estado para dados de DATA - [VEHICLE]
  const [usuarios, setUsuarios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [dadosSelecionados, setDadosSelecionados] = useState(null);
  const [dataSelecionada, setDataSelecionada] = useState('');
  const [filtroUsuario, setFiltroUsuario] = useState('');
  const [filtroData, setFiltroData] = useState('');
  const {
    isOpen: isOpenRelatorio,
    onOpen: onOpenRelatorio,
    onClose: onCloseRelatorio
  } = useDisclosure();

  const carregarDados = async () => {
    try {
      setCarregando(true);
      const [dadosKm, dadosUsuarios, dadosVeiculos] = await Promise.all([
        listarRegistrosKm(),
        listarUsuarios(),
        listarVeiculos() // Carregar dados de DATA - [VEHICLE]
      ]);
      setRegistros(dadosKm);
      setUsuarios(dadosUsuarios);
      setVeiculos(dadosVeiculos);
    } catch (e) {
      console.error('Erro ao carregar dados:', e);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const buscarNomeUsuario = (cpf) => {
    const user = usuarios.find((u) => u['UnicID-CPF'] === cpf);
    return user ? `${user.first_nome} ${user.last_nome}` : cpf;
  };

  // Função para buscar ABASTECIMENTO-ZERADO por UnicID-CPF
  const buscarAbastecimentoZerado = (cpf) => {
    const veiculo = veiculos.find((v) => v['UnicID-CPF'] === cpf);
    return veiculo?.['ABASTECIMENTO-ZERADO'] || [];
  };

  return (
    <Box>
      <Heading size="lg" mb={6}>Registros de KM</Heading>

      <HStack justify="space-between" mb={6} flexWrap="wrap">
        <HStack spacing={4}>
          <Select
            placeholder="Filtrar por usuário"
            value={filtroUsuario}
            onChange={(e) => setFiltroUsuario(e.target.value)}
            maxW="250px"
            bg="white"
          >
            {usuarios.map((u) => (
              <option key={u.Id} value={u['UnicID-CPF']}>
                {u.first_nome} {u.last_nome}
              </option>
            ))}
          </Select>
          <Input
            type="date"
            value={filtroData}
            onChange={(e) => setFiltroData(e.target.value)}
            maxW="200px"
            bg="white"
          />
        </HStack>
        <Button colorScheme="teal" onClick={onOpenRelatorio}>
          Relatório
        </Button>
      </HStack>

      {carregando ? (
        <Spinner />
      ) : registros.length === 0 ? (
        <Text>Nenhum registro encontrado.</Text>
      ) : (
        <Box
          overflowX="auto"
          border="1px solid"
          borderColor="gray.200"
          rounded="md"
          bg="white"
          boxShadow="sm"
        >
          <Table variant="simple" size="md">
            <Thead bg="gray.50">
              <Tr>
                <Th><Icon as={FiCalendar} mr={2} />Data</Th>
                <Th><Icon as={FiUser} mr={2} />Usuário</Th>
                <Th><Icon as={FiTruck} mr={2} />Veículo</Th>
                <Th><Icon as={FiMap} mr={2} />Dia</Th>
                <Th><Icon as={FiMap} mr={2} />KM</Th>
                <Th><Icon as={FiDroplet} mr={2} />Abasteceu</Th>
                <Th><Icon as={FiDroplet} mr={2} />Tipo</Th>
                <Th><Icon as={FiDollarSign} mr={2} />Valor</Th>
              </Tr>
            </Thead>
            <Tbody>
              {registros
                .filter((registro) =>
                  !filtroUsuario || registro['UnicID-CPF'] === filtroUsuario
                )
                .map((registro) => {
                  const cpf = registro['UnicID-CPF'];
                  const nomeUsuario = buscarNomeUsuario(cpf);
                  const control = registro['KM-CONTROL-SEMANAL'] || {};

                  return Object.entries(control).flatMap(([data, lista]) =>
                    lista
                      .filter(() => {
                        if (!filtroData) return true;
                        return dayjs(data).isSame(dayjs(filtroData), 'day');
                      })
                      .map((item, i) => {
                        const km = item['KM-Control'];
                        const totalKm = km?.['TOTAL-KM_RODADO'] ?? 0;
                        const abasteceu = km?.['ABASTECEU'];
                        const valor = km?.['VALOR_ABASTECIMENTO'] ?? '-';
                        const tipo = km?.['TIPO_DE_ABASTECIMENTO'] ?? '-';
                        const veiculo = km?.['VEICULO'] ?? '-';
                        const diaSemana = item['Dia-da-Semana'];

                        return (
                          <Tr
                            key={`${cpf}-${data}-${i}`}
                            _hover={{ bg: 'gray.50', cursor: 'pointer' }}
                            onClick={() => {
                              setDadosSelecionados(item);
                              setDataSelecionada(data);
                              onOpen();
                            }}
                          >
                            <Td>{dayjs(data).format('DD/MM/YYYY')}</Td>
                            <Td fontWeight="semibold">{nomeUsuario}</Td>
                            <Td>{veiculo}</Td>
                            <Td>{diaSemana}</Td>
                            <Td>
                              <Badge colorScheme="blue">{totalKm} KM</Badge>
                            </Td>
                            <Td>
                              <Badge colorScheme={abasteceu ? 'green' : 'gray'}>
                                {abasteceu ? 'SIM' : 'NÃO'}
                              </Badge>
                            </Td>
                            <Td>{tipo}</Td>
                            <Td>{valor}</Td>
                          </Tr>
                        );
                      })
                  );
                })}
            </Tbody>
          </Table>

          <ModalDetalhesKm
            isOpen={isOpen}
            onClose={onClose}
            dados={dadosSelecionados}
            data={dayjs(dataSelecionada).format('DD/MM/YYYY')}
            abastecimentoZerado={buscarAbastecimentoZerado(dadosSelecionados?.['UnicID-CPF'])}
            cpfUsuario={dadosSelecionados?.['UnicID-CPF']}
          />

          <ModalGerarRelatorio
            isOpen={isOpenRelatorio}
            onClose={onCloseRelatorio}
            usuarios={usuarios}
            registros={registros}
          />
        </Box>
      )}
    </Box>
  );
}