import {
  Box,
  Heading,
  Text,
  VStack,
  Image,
  Button,
  Link,
  useBreakpointValue,
  Spinner,
  Input,
  IconButton,
  HStack,
  useToast
} from '@chakra-ui/react';
import { FiDownload, FiUser, FiKey, FiCopy, FiEye, FiEyeOff } from 'react-icons/fi';
import { useEffect, useState } from 'react';

const NOCODB_URL = import.meta.env.VITE_NOCODB_URL;
const NOCODB_TOKEN = import.meta.env.VITE_NOCODB_TOKEN;

export default function Sobre() {
  const [dadosAdmin, setDadosAdmin] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const fetchDadosAdmin = async () => {
      try {
        const res = await fetch(`${NOCODB_URL}/api/v2/tables/m98ivs3k3csc04e/records`, {
          headers: { 'xc-token': NOCODB_TOKEN },
        });
        const data = await res.json();
        setDadosAdmin(data?.list?.[0] || null);
      } catch (err) {
        console.error('Erro ao buscar dados ADMIN:', err);
      } finally {
        setCarregando(false);
      }
    };

    fetchDadosAdmin();
  }, []);

  const handleCopiar = () => {
    navigator.clipboard.writeText(dadosAdmin?.['Password-mester'] || '');
    toast({
      title: 'Senha copiada!',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  return (
    <Box p={6} maxW="800px" mx="auto">
      <VStack spacing={6} align="start">
        <Heading size="lg" display="flex" alignItems="center" gap={2}>
          <FiUser /> Sobre o Sistema
        </Heading>

        <Text fontSize="md" color="gray.700">
          Este sistema foi desenvolvido por <strong>Jota (João Carlos)</strong> em parceria com a empresa <strong>AppSystem</strong>, com o objetivo de facilitar o controle e monitoramento de veículos em tempo real.
        </Text>

        <Image
          src="/logo-viaCorp.png"
          alt="Logo do sistema"
          maxW="200px"
          borderRadius="md"
        />

        {carregando ? (
          <Spinner size="lg" />
        ) : (
          <>
            <Box w="full">
              <Heading size="md" mb={2}>
                📱 Baixe o ViaCorp - Service para Android
              </Heading>
              <Text mb={4}>Baixe o Service de Rastreio em tempo real:</Text>

              {dadosAdmin?.DownloadLink ? (
                <Link href={dadosAdmin.DownloadLink} isExternal>
                  <Button leftIcon={<FiDownload />} colorScheme="teal">
                    Download Service (.apk)
                  </Button>
                </Link>
              ) : (
                <Text color="red.500">Link não disponível.</Text>
              )}
            </Box>

            <Box w="full" mt={6} bg="gray.50" borderRadius="lg" p={4} boxShadow="sm">
              <Heading size="md" mb={3} display="flex" alignItems="center" gap={2}>
                <FiKey /> Senha Master
              </Heading>

              <HStack spacing={2}>
                <Input
                  value={dadosAdmin?.['Password-mester'] || ''}
                  type={mostrarSenha ? 'text' : 'password'}
                  readOnly
                  bg="white"
                  flex={1}
                  fontWeight="medium"
                />
                <IconButton
                  icon={mostrarSenha ? <FiEyeOff /> : <FiEye />}
                  aria-label="Mostrar senha"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  variant="outline"
                />
                <IconButton
                  icon={<FiCopy />}
                  aria-label="Copiar senha"
                  onClick={handleCopiar}
                  variant="outline"
                />
              </HStack>
            </Box>
          </>
        )}
      </VStack>
    </Box>
  );
}
