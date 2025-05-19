import {
  Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalCloseButton, ModalBody, ModalFooter,
  Button, Select, Input, VStack, Box, Text, HStack // <- Aqui
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isBetween from 'dayjs/plugin/isBetween';
import 'dayjs/locale/pt-br';

dayjs.locale('pt-br');
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(isBetween);


export default function ModalGerarRelatorio({
  isOpen, onClose, usuarios, registros
}) {
  const [usuarioSelecionado, setUsuarioSelecionado] = useState('');
    const [dataInicio, setDataInicio] = useState('');
    const [dataFim, setDataFim] = useState('');

    const filtrarRegistros = () => {
    return registros
        .filter((r) => usuarioSelecionado === '' || r['UnicID-CPF'] === usuarioSelecionado)
        .flatMap((r) => {
        const control = r['KM-CONTROL-SEMANAL'] || {};
        return Object.entries(control)
            .filter(([data]) => {
            const dataFormatada = dayjs(data);
            const inicio = dataInicio ? dayjs(dataInicio) : null;
            const fim = dataFim ? dayjs(dataFim) : null;

            if (inicio && fim) {
                return dataFormatada.isBetween(inicio.subtract(1, 'day'), fim.add(1, 'day'));
            } else if (inicio) {
                return dataFormatada.isSameOrAfter(inicio);
            } else if (fim) {
                return dataFormatada.isSameOrBefore(fim);
            }
            return true;
            })
            .map(([data, lista]) => ({
            data,
            usuario: usuarios.find((u) => u['UnicID-CPF'] === r['UnicID-CPF']),
            itens: lista
            }));
        });
    };


const handleExportPDF = async () => {
  const container = document.getElementById('relatorio-print-area');

  container.style.display = 'block';

  const canvas = await html2canvas(container, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#fff'
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  const imgProps = pdf.getImageProperties(imgData);
  const imgWidth = pdfWidth;
  const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  heightLeft -= pdfHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;
  }

  pdf.save('relatorio.pdf');
  container.style.display = 'none';
};



  const handleExportXLSX = () => {
    const rows = [];

    filtrarRegistros().forEach(({ data, usuario, itens }) => {
      itens.forEach((item) => {
        const km = item['KM-Control'];
        rows.push({
          Data: data,
          Nome: usuario ? `${usuario.first_nome} ${usuario.last_nome}` : 'Desconhecido',
          Veículo: km.VEICULO,
          KM_Rodado: km['TOTAL-KM_RODADO'],
          Abasteceu: km['ABASTECEU'] ? 'Sim' : 'Não',
          Tipo: km['TIPO_DE_ABASTECIMENTO'],
          Valor: km['VALOR_ABASTECIMENTO']
        });
      });
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Relatório');
    XLSX.writeFile(wb, 'relatorio.xlsx');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Gerar Relatório</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
            <VStack spacing={4} w="100%" align="start">
            <Select
                placeholder="Selecionar usuário"
                value={usuarioSelecionado}
                onChange={(e) => setUsuarioSelecionado(e.target.value)}
                w="100%"
            >
                {usuarios.map((u) => (
                <option key={u.Id} value={u['UnicID-CPF']}>
                    {u.first_nome} {u.last_nome}
                </option>
                ))}
            </Select>

            <HStack w="100%" spacing={4}>
                <Input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                />
                <Input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                />
            </HStack>

            {dataInicio && dataFim && (
                <Text fontSize="sm" color="gray.600">
                Intervalo selecionado: {dayjs(dataInicio).format('DD/MM/YYYY')} até {dayjs(dataFim).format('DD/MM/YYYY')}
                </Text>
            )}
            </VStack>



            {/* Elemento invisível apenas para render do PDF */}
            <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
            <Box
                id="relatorio-print-area"
                p={8}
                bg="white"
                color="black"
                fontFamily="'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
                w="800px"
            >
                <Box textAlign="center" mb={8}>
                <Text fontSize="3xl" fontWeight="bold" color="teal.600">
                    📄 Relatório de KM - ViaCorp
                </Text>
                <Text fontSize="sm" color="gray.600">
                    Gerado em: {dayjs().format('DD/MM/YYYY HH:mm')}
                </Text>
                </Box>

                {filtrarRegistros().map(({ data, usuario, itens }, idx) => (
                <Box
                    key={idx}
                    mb={6}
                    border="1px solid #ccc"
                    borderRadius="lg"
                    p={4}
                    boxShadow="sm"
                    background="gray.50"
                >
                    <Text fontWeight="bold" fontSize="md" mb={2} color="blue.700">
                    {dayjs(data).format('DD/MM/YYYY')} — {usuario?.first_nome} {usuario?.last_nome}
                    </Text>

                    <Box pl={2}>
                    {itens.map((item, i) => {
                        const km = item['KM-Control'];
                        return (
                        <Box
                            key={i}
                            mb={2}
                            p={3}
                            background="white"
                            borderRadius="md"
                            border="1px solid #e0e0e0"
                            fontSize="sm"
                        >
                            <Text><strong>Veículo:</strong> {km.VEICULO}</Text>
                            <Text><strong>KM Rodado:</strong> {km['TOTAL-KM_RODADO']} {km.UNIDADE}</Text>
                            <Text><strong>Abasteceu:</strong> {km['ABASTECEU'] ? 'Sim' : 'Não'}</Text>
                            <Text><strong>Tipo:</strong> {km['TIPO_DE_ABASTECIMENTO'] || '-'}</Text>
                            <Text><strong>Valor:</strong> {km['VALOR_ABASTECIMENTO'] || '-'}</Text>
                            <Text><strong>Consumo Real:</strong> {km['CONSUMO_REAL_KM_L']} km/L</Text>
                            <Text><strong>Litros Abastecidos:</strong> {km['LITROS_ABASTECIDOS']} L</Text>
                            <Text><strong>Litros Restantes Após:</strong> {km['LITROS_RESTANTES_APOS']} L</Text>
                        </Box>
                        );
                    })}
                    </Box>
                </Box>
                ))}
            </Box>
            </div>



        </ModalBody>
        <ModalFooter>
          <Button onClick={handleExportPDF} colorScheme="red" mr={3}>
            Baixar PDF
          </Button>
          <Button onClick={handleExportXLSX} colorScheme="blue">
            Baixar XLSX
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
