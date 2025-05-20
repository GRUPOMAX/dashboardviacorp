import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton,
  ModalBody, Text, VStack, Box
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { listarRegistrosKm, listarVeiculos, listarVeiculosEmpresa } from '../services/api';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
dayjs.locale('pt-br');

const NOCODB_TOKEN = import.meta.env.VITE_NOCODB_TOKEN;

export default function ModalUltimosAbastecimentos({ isOpen, onClose, veiculo, tipo }) {
  const [abastecimentos, setAbastecimentos] = useState([]);

  useEffect(() => {
    const buscarAbastecimentos = async () => {
      try {
        let resultado = [];

        const headers = { 'xc-token': NOCODB_TOKEN };

        // 🔄 Mapeia CPF → Nome do usuário
        const resUsuarios = await fetch(`https://nocodb.nexusnerds.com.br/api/v2/tables/msehqhsr7j040uq/records?limit=1000`, { headers });
        const listaUsuarios = await resUsuarios.json();
        const mapaUsuarios = {};
        listaUsuarios.list.forEach(u => {
          const nome = `${u.first_nome ?? ''} ${u.last_nome ?? ''}`.trim();
          mapaUsuarios[u['UnicID-CPF']] = nome || 'Usuário';
        });

        // 1. Abastecimentos do tipo usuário
        if (tipo === 'usuario') {
          const dados = await listarRegistrosKm();

          dados.forEach(user => {
            const semanas = user['KM-CONTROL-SEMANAL'] || {};

            Object.entries(semanas).forEach(([data, registros]) => {
              registros.forEach(reg => {
                const info = reg['KM-Control'];
                if (!info?.ABASTECEU || !info?.VEICULO) return;
                if (info.VEICULO?.toLowerCase() !== veiculo?.toLowerCase()) return;

                resultado.push({
                  Data: dayjs(data).format('DD/MM/YYYY'),
                  'Usuário': mapaUsuarios[user['UnicID-CPF']] || 'Desconhecido',
                  Valor: info.VALOR_ABASTECIMENTO,
                  Litros: info.LITROS_ABASTECIDOS,
                  'Restante Após': info.LITROS_RESTANTES_APOS ?? '-'
                });
              });
            });
          });

          // ➕ Inclui registros do campo ABASTECIMENTO-ZERADO (tabela DATA - [VEHICLE])
          const resZerado = await fetch(`https://nocodb.nexusnerds.com.br/api/v2/tables/m1sy388a4zv1kgl/records`, { headers });
          const dadosZerado = await resZerado.json();
          dadosZerado.list.forEach(entry => {
            if (entry['MODEL-VEHICLE']?.toLowerCase() !== veiculo?.toLowerCase()) return;

            const lista = entry['ABASTECIMENTO-ZERADO'] || [];
            lista.forEach(item => {
              resultado.push({
                Data: dayjs(item.data).format('DD/MM/YYYY'),
                'Usuário': mapaUsuarios[entry['UnicID-CPF']] || 'Desconhecido',
                Valor: item.valor,
                Litros: item.litros,
                'Restante Após': entry['ABASTECIMENTO-DISPONIVELE-LITRO'] ?? '-'
              });
            });
          });
        }

        // 2. Abastecimentos do tipo empresa (tabela Vehicle Standard)
        if (tipo === 'empresa') {
          const dados = await listarVeiculosEmpresa();

          dados.forEach(entry => {
            const comprovantes = entry.comprovante || [];
            comprovantes.forEach(comp => {
              if (comp.veiculo?.toLowerCase() !== veiculo?.toLowerCase()) return;

              resultado.push({
                Data: dayjs(comp.data).format('DD/MM/YYYY'),
                'Usuário': comp.responsavel || entry.Enterprise || 'Empresa',
                Valor: comp.valor ?? '-',
                Litros: comp.litros,
                'Restante Após': '-'
              });
            });
          });
        }

        // Ordena por data decrescente
        const ordenado = resultado.sort((a, b) =>
          dayjs(b.Data, 'DD/MM/YYYY').unix() - dayjs(a.Data, 'DD/MM/YYYY').unix()
        );
        setAbastecimentos(ordenado);
      } catch (err) {
        console.error('Erro ao buscar abastecimentos:', err);
      }
    };

    if (isOpen && veiculo) buscarAbastecimentos();
  }, [isOpen, veiculo, tipo]);


  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Últimos Abastecimentos</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {abastecimentos.length === 0 ? (
            <Text color="gray.500">Nenhum abastecimento encontrado.</Text>
          ) : (
            <VStack spacing={4} align="start">
              {abastecimentos.map((ab, i) => (
                <Box key={i} borderWidth={1} borderRadius="md" p={4} w="100%" bg="gray.50">
                  <Text><strong>Data:</strong> {ab.Data}</Text>
                  <Text><strong>Usuário:</strong> {ab['Usuário']}</Text>
                  <Text><strong>Valor:</strong> {ab.Valor}</Text>
                  <Text><strong>Litros:</strong> {ab.Litros} L</Text>
                  <Text><strong>Restante Após:</strong> {ab['Restante Após']} L</Text>
                </Box>
              ))}
            </VStack>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
