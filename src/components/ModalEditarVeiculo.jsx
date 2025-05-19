import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton,
  ModalBody, ModalFooter, Button, Input, VStack, useToast, FormLabel, Box 
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import axios from 'axios';

const BASE_URL = 'https://nocodb.nexusnerds.com.br/api/v2/tables';
const TOKEN = import.meta.env.VITE_NOCODB_TOKEN;

export default function ModalEditarVeiculo({ isOpen, onClose, dados, tipo, onAtualizado }) {
  const toast = useToast();
  const [form, setForm] = useState({
    Id: '',
    'MODEL-VEHICLE': '',
    'KM-PERFORMACE': '',
    'LITROS-MAXIMO': '',
    'ABASTECIMENTO-DISPONIVELE-LITRO': ''
  });

  useEffect(() => {
    if (dados) {
      setForm({
        Id: dados?.Id || '',
        'MODEL-VEHICLE': dados['MODEL-VEHICLE'] || dados.veiculo || '',
        'KM-PERFORMACE': dados['KM-PERFORMACE'] || '',
        'LITROS-MAXIMO': dados['LITROS-MAXIMO'] || '',
        'ABASTECIMENTO-DISPONIVELE-LITRO': dados['ABASTECIMENTO-DISPONIVELE-LITRO'] || ''
      });
    }
  }, [dados]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSalvar = async () => {
    try {
      await axios.patch(`${BASE_URL}/m1sy388a4zv1kgl/records`, form, {
        headers: { 'xc-token': TOKEN }
      });

      toast({
        title: 'Veículo atualizado com sucesso!',
        status: 'success',
        duration: 3000,
        isClosable: true
      });

      onClose();
      onAtualizado?.();
    } catch (err) {
      console.error(err);
      toast({
        title: 'Erro ao atualizar veículo',
        status: 'error',
        duration: 4000,
        isClosable: true
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Editar Veículo</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={3} w="100%">
            <Box w="100%">
              <FormLabel>Modelo do Veículo</FormLabel>
              <Input
                placeholder="Modelo do Veículo"
                name="MODEL-VEHICLE"
                value={form['MODEL-VEHICLE']}
                onChange={handleChange}
              />
            </Box>
            <Box w="100%">
              <FormLabel>KM por Litro</FormLabel>
              <Input
                placeholder="KM por Litro"
                name="KM-PERFORMACE"
                value={form['KM-PERFORMACE']}
                onChange={handleChange}
              />
            </Box>
            <Box w="100%">
              <FormLabel>Capacidade Máxima de Litros</FormLabel>
              <Input
                placeholder="Capacidade Máxima de Litros"
                name="LITROS-MAXIMO"
                value={form['LITROS-MAXIMO']}
                onChange={handleChange}
              />
            </Box>
            <Box w="100%">
              <FormLabel>Combustível Disponível (Litros)</FormLabel>
              <Input
                placeholder="Combustível Disponível (Litros)"
                name="ABASTECIMENTO-DISPONIVELE-LITRO"
                value={form['ABASTECIMENTO-DISPONIVELE-LITRO']}
                onChange={handleChange}
              />
            </Box>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="green" onClick={handleSalvar}>Salvar</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}