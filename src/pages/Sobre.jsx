import {
  Box,
  Heading,
  Text,
  VStack,
  Image,
  Button,
  Link,
  useBreakpointValue,
} from '@chakra-ui/react';
import { FiDownload, FiUser } from 'react-icons/fi';

export default function Sobre() {
  const isMobile = useBreakpointValue({ base: true, md: false });

  return (
    <Box p={6} maxW="800px" mx="auto">
      <VStack spacing={6} align="start">
        <Heading size="lg" display="flex" alignItems="center" gap={2}>
          <FiUser /> Sobre o Sistema
        </Heading>

        <Text fontSize="md" color="gray.700">
          Este sistema foi desenvolvido por <strong>Jota(João Carlos)</strong> em Parceiria com sua Empresa<strong> AppSystem </strong>com o objetivo de facilitar o controle e monitoramento de veículos em tempo real. A aplicação permite registrar dados de KM, abastecimentos, exibir mapas com trajetos históricos, e muito mais.
        </Text>

        <Image
          src="/logo-viaCorp.png"
          alt="Logo do sistema"
          maxW="200px"
          borderRadius="md"
        />

        <Box w="full">
          <Heading size="md" mb={2}>
            📱 Baixe o aplicativo Android 
          </Heading>
          <Text mb={4}>Baixe o Service de Rastreio em tempo Real:</Text>
          <Link href="https://nextcloud.nexusnerds.com.br/s/fWKLGPCrfFioaeM/download/ViaCorPService%202.0.apk" isExternal>
            <Button leftIcon={<FiDownload />} colorScheme="teal">
              Download Service (.apk)
            </Button>
          </Link>
        </Box>
      </VStack>
    </Box>
  );
}
