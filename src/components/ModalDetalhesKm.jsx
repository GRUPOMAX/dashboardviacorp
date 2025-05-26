import {
  Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalCloseButton, ModalBody, ModalFooter, Button,
  Text, VStack, HStack, Badge, Box, Icon, Divider, Image
} from '@chakra-ui/react';
import {
  FiTruck, FiMapPin, FiDroplet, FiClock, FiDollarSign, FiExternalLink
} from 'react-icons/fi';
import dayjs from 'dayjs';
import { useState } from 'react';

export default function ModalDetalhesKm({ isOpen, onClose, dados, data, abastecimentoZerado = [], cpfUsuario }) {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [mostrarImagensKm, setMostrarImagensKm] = useState(false); // ✅ Adicione isto
  

  if (!dados || !dados['KM-Control']) {
    //console.log('Dados ou KM-Control ausentes:', { dados });
    return null;
  }
  const km = dados['KM-Control'];
  const urlImagemKmInicial = km['URL_IMG-KM-INICIAL'];
  const urlImagemKmFinal = km['URL_IMG-KM-FINAL'];

  const dataInicio = dayjs(data, 'DD/MM/YYYY').isValid()
  ? dayjs(data, 'DD/MM/YYYY').format('YYYY-MM-DD')
  : dayjs().format('YYYY-MM-DD');

  const dataFinalizacao = km?.DATA_FINALIZACAO;
  const houveAtraso = dataFinalizacao && dataFinalizacao !== dataInicio;

  const comprovantesKm = [
    km['URL_IMG-KM-COMPROVANTE_ABASTECIMENTO_1'],
    km['URL_IMG-KM-COMPROVANTE_ABASTECIMENTO_2']
  ].filter(url => url && typeof url === 'string');



  // Formatar a data com validação
  const dataFormatada = dayjs(data, 'DD/MM/YYYY').isValid()
    ? dayjs(data, 'DD/MM/YYYY').format('YYYY-MM-DD')
    : dayjs().format('YYYY-MM-DD');

  // Filtrar comprovantes de ABASTECIMENTO-ZERADO
  //console.log('Abastecimento Zerado Recebido:', abastecimentoZerado);
  const comprovantesZerado = abastecimentoZerado
    ?.filter(item => {
      const isSameDate = item?.data === dataFormatada;
      //console.log('Comparando datas:', { itemData: item?.data, dataFormatada, isSameDate });
      return isSameDate;
    })
    ?.flatMap(item => item?.comprovantes || [])
    || [];

  const comprovantes = [...comprovantesKm, ...comprovantesZerado];

  //console.log("CPF USUARIO:", cpfUsuario);
  //console.log("DATA ANALISADA:", data);
  //console.log("DATA FORMATADA:", dataFormatada);
  //console.log("COMPROVANTES (KM):", comprovantesKm);
  //console.log("COMPROVANTES (ZERADO):", comprovantesZerado);
  //console.log("COMPROVANTES FINAIS:", comprovantes);

  // Função para abrir o modal da imagem
  const openImageModal = (url) => {
    setSelectedImage(url);
    setIsImageModalOpen(true);
  };

  // Função para fechar o modal da imagem
  const closeImageModal = () => {
    setSelectedImage(null);
    setIsImageModalOpen(false);
  };

  // Função para abrir a imagem em uma nova guia
  const openImageInNewTab = () => {
    if (selectedImage) {
      window.open(selectedImage, '_blank');
    }
  };

  return (
    <>
      {/* Modal Principal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
        <ModalOverlay />
        <ModalContent rounded="xl" p={2}>
          <ModalHeader fontWeight="bold" fontSize="xl" pb={0}>
            <HStack>
              <Icon as={FiMapPin} />
              <Text>Detalhes de {data}</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton top={3} right={4} />
          <ModalBody pt={4}>

          {houveAtraso && (
            <Box p={3} bg="orange.100" borderRadius="md" borderLeft="4px solid #DD6B20">
              <Text fontWeight="bold" color="orange.700">⚠ Atenção</Text>
              <Text fontSize="sm" color="orange.700">
                Este dia foi finalizado em atraso ({dayjs(dataFinalizacao).format('DD/MM/YYYY')}).
              </Text>
            </Box>
          )}


            <VStack align="start" spacing={4}>
              {/* Veículo e KM */}
              <Box w="100%">
                <HStack justify="space-between">
                  <Text><strong>Veículo:</strong> {km.VEICULO}</Text>
                  <Badge colorScheme="blue">{km.UNIDADE?.toUpperCase()}</Badge>
                </HStack>
                <Text fontSize="sm">
                  <strong>KM Inicial:</strong> {km['KM-INICIAL']} km às {km['HORA_KM-INICIAL']}
                </Text>
                <Text fontSize="sm">
                  <strong>KM Final:</strong> {km['KM-FINAL']} km às {km['HORA_KM-FINAL']}
                </Text>
                <Text fontSize="sm">
                  <strong>Total Rodado:</strong> {km['TOTAL-KM_RODADO']} {km.UNIDADE}
                </Text>

                <Button
                  mt={2}
                  size="sm"
                  colorScheme="gray"
                  variant="outline"
                  onClick={() => setMostrarImagensKm(!mostrarImagensKm)}
                >
                  {mostrarImagensKm ? 'Ocultar Imagens do KM' : 'Visualizar KM (Inicial e Final)'}
                </Button>

                {mostrarImagensKm && (
                  <HStack spacing={4} mt={3} wrap="wrap">
                    <VStack spacing={1} align="center">
                      <Text fontSize="xs"><strong>KM Inicial</strong></Text>
                      {urlImagemKmInicial ? (
                        <Image
                          src={urlImagemKmInicial}
                          alt="KM Inicial"
                          maxW="120px"
                          borderRadius="md"
                          border="1px solid #ccc"
                          cursor="pointer"
                          onClick={() => openImageModal(urlImagemKmInicial)}
                          fallbackSrc="https://via.placeholder.com/120?text=Indisponível"
                        />
                      ) : (
                        <Text fontSize="xs" color="gray.500">Imagem não disponível</Text>
                      )}
                    </VStack>

                    <VStack spacing={1} align="center">
                      <Text fontSize="xs"><strong>KM Final</strong></Text>
                      {urlImagemKmFinal ? (
                        <Image
                          src={urlImagemKmFinal}
                          alt="KM Final"
                          maxW="120px"
                          borderRadius="md"
                          border="1px solid #ccc"
                          cursor="pointer"
                          onClick={() => openImageModal(urlImagemKmFinal)}
                          fallbackSrc="https://via.placeholder.com/120?text=Indisponível"
                        />
                      ) : (
                        <Text fontSize="xs" color="gray.500">Imagem não disponível</Text>
                      )}
                    </VStack>
                  </HStack>
                )}
              </Box>


              {/* Abastecimento */}
              <Divider />
              <Box w="100%">
                <HStack justify="space-between">
                  <HStack>
                    <Icon as={FiDroplet} />
                    <Text><strong>Abasteceu?</strong></Text>
                  </HStack>
                  <Badge colorScheme={km.ABASTECEU ? 'green' : 'gray'}>
                    {km.ABASTECEU ? 'SIM' : 'NÃO'}
                  </Badge>
                </HStack>

                {(km.ABASTECEU || comprovantes.length > 0) && (
                  <VStack align="start" spacing={1} mt={2} w="100%">
                    {km.ABASTECEU && (
                      <>
                        <Text fontSize="sm"><strong>Tipo:</strong> {km['TIPO_DE_ABASTECIMENTO']}</Text>
                        <Text fontSize="sm"><strong>Valor:</strong> {km['VALOR_ABASTECIMENTO']}</Text>
                        <Text fontSize="sm"><strong>Litros Abastecidos:</strong> {km['LITROS_ABASTECIDOS']} L</Text>
                        <Text fontSize="sm"><strong>Preço por Litro:</strong> R$ {km['PRECO_POR_LITRO']}</Text>
                      </>
                    )}

                    {comprovantes.length > 0 ? (
                      <Box w="100%" pt={2}>
                        <Text fontWeight="semibold" mb={1}>Comprovantes:</Text>
                        <HStack spacing={3} wrap="wrap">
                          {comprovantes.map((url, index) => (
                            <Image
                              key={index}
                              src={url}
                              alt={`Comprovante ${index + 1}`}
                              maxW="100px"
                              borderRadius="md"
                              border="1px solid #ccc"
                              fallbackSrc="https://via.placeholder.com/100?text=Imagem+Indisponível"
                              cursor="pointer"
                              onClick={() => openImageModal(url)}
                            />
                          ))}
                        </HStack>
                      </Box>
                    ) : (
                      <Text fontSize="sm" color="gray.500" pt={2}>Nenhum comprovante disponível.</Text>
                    )}
                  </VStack>
                )}
              </Box>

              {/* Consumo e Performance */}
              <Divider />
              <Box w="100%">
                <Text fontSize="sm"><strong>Consumo Real:</strong> {km['CONSUMO_REAL_KM_L']} km/L</Text>
                <Text fontSize="sm"><strong>Performance Padrão:</strong> {km['PERFORMANCE_PADRAO_KM_L']} km/L</Text>
                <Text fontSize="sm"><strong>Litros Restantes Após:</strong> {km['LITROS_RESTANTES_APOS']} L</Text>
                <Text fontSize="sm"><strong>Litros Consumidos:</strong> {km['LITROS_CONSUMIDOS']} L</Text>
              </Box>

              {/* Observação */}
              {km.OBSERVAÇÃO && (
                <>
                  <Divider />
                  <Box w="100%">
                    <Text fontSize="sm" color="gray.600">
                      <strong>Observação:</strong> {km.OBSERVAÇÃO}
                    </Text>
                  </Box>
                </>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose} colorScheme="blue" rounded="lg">
              Fechar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal para Visualizar Imagem */}
      <Modal isOpen={isImageModalOpen} onClose={closeImageModal} size="xl" isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalBody p={4}>
            <Box position="relative">
              <Image
                src={selectedImage}
                alt="Comprovante Ampliado"
                maxW="100%"
                maxH="80vh"
                objectFit="contain"
                fallbackSrc="https://via.placeholder.com/400?text=Imagem+Indisponível"
              />
              <Button
                position="absolute"
                top="10px"
                right="10px"
                size="sm"
                colorScheme="blue"
                onClick={openImageInNewTab}
                leftIcon={<Icon as={FiExternalLink} />}
                aria-label="Abrir imagem em nova guia"
              >
                Abrir em Nova Guia
              </Button>
            </Box>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}