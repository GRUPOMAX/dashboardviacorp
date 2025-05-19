import { Box, Button, Input, Text, VStack, useToast, Image } from '@chakra-ui/react';
import { useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_NOCODB_URL;
const API_TOKEN = import.meta.env.VITE_NOCODB_TOKEN;

export default function Login({ onLogin }) {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/v2/tables/m98ivs3k3csc04e/records`, {
        headers: { 'xc-token': API_TOKEN }
      });

      const user = data.list.find(u => u.email === email && u.password === password);

      if (user) {
        localStorage.setItem('token', 'logado');
        onLogin();
      } else {
        toast({ title: 'Credenciais inválidas', status: 'error', duration: 2000 });
      }
    } catch (err) {
      toast({ title: 'Erro ao conectar ao servidor', status: 'error' });
    }
  };

  return (
    <Box w="100vw" h="100vh" display="flex" alignItems="center" justifyContent="center" bg="gray.100">
      <Box bg="white" p={8} rounded="md" boxShadow="md" w="100%" maxW="400px" textAlign="center">
        
        {/* Logo da empresa */}
        <Image
          src="/logo-viaCorp.png"
          alt="Logo ViaCorp"
          maxW="120px"
          mx="auto"
          mb={4}
        />

        <Text fontSize="2xl" fontWeight="bold" mb={4}>Dashboard ViaCorp</Text>

        <VStack spacing={4}>
          <Input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
          <Input placeholder="Senha" type="password" value={password} onChange={e => setPassword(e.target.value)} />
          <Button colorScheme="blue" onClick={handleLogin} w="full">Entrar</Button>
        </VStack>
      </Box>
    </Box>
  );
}
