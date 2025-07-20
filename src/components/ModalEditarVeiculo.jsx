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

  const validateForm = () => {
    if (!form['MODEL-VEHICLE']) return 'Modelo do veículo é obrigatório.';
    if (!form['KM-PERFORMACE'] || isNaN(form['KM-PERFORMACE'])) return 'KM por litro deve ser um número válido.';
    if (!form['LITROS-MAXIMO'] || isNaN(form['LITROS-MAXIMO'])) return 'Capacidade máxima deve ser um número válido.';
    if (!form['ABASTECIMENTO-DISPONIVELE-LITRO'] || isNaN(form['ABASTECIMENTO-DISPONIVELE-LITRO'])) return 'Combustível disponível deve ser um número válido.';
    return null;
  };

const handleSalvar = async () => {
  try {
    console.log('🔧 Tipo do veículo:', tipo);
    console.log('📦 Formulário:', form);

    // Validação dos campos
    const error = validateForm();
    if (error) throw new Error(error);

    if (tipo === 'usuario') {
      if (!form.Id) throw new Error('ID do veículo não encontrado.');

      console.log('🔄 Enviando PATCH para veículo do usuário...');
      const payload = {
        Id: form.Id, // Inclui o ID no payload
        'MODEL-VEHICLE': form['MODEL-VEHICLE'],
        'KM-PERFORMACE': Number(form['KM-PERFORMACE']),
        'LITROS-MAXIMO': Number(form['LITROS-MAXIMO']),
        'ABASTECIMENTO-DISPONIVELE-LITRO': Number(form['ABASTECIMENTO-DISPONIVELE-LITRO'])
      };
      const response = await axios.patch(`${BASE_URL}/md6hsq8rx1mmxg2/records`, payload, {
        headers: { 'xc-token': TOKEN }
      });
      console.log('✅ PATCH usuário OK:', response.data);

    } else if (tipo === 'empresa') {
      console.log('🔍 Buscando veículos da empresa...');
      const { data } = await axios.get(`${BASE_URL}/mu0erb59zudhecf/records`, {
        headers: { 'xc-token': TOKEN }
      });

      const empresa = data.list.find(item => {
        let lista;
        try {
          lista = typeof item['Vehicle-Standard'] === 'string'
            ? JSON.parse(item['Vehicle-Standard'])
            : item['Vehicle-Standard'];
        } catch (e) {
          console.error('❌ Erro ao parsear Vehicle-Standard:', e);
          return false;
        }
        return Array.isArray(lista) && lista.some(v => v.veiculo === form['MODEL-VEHICLE']);
      });

      if (!empresa) throw new Error('Veículo não encontrado em Vehicle-Standard.');
      if (!empresa.Id) throw new Error('ID do registro da empresa não encontrado.');

      let listaAtualizada;
      try {
        listaAtualizada = typeof empresa['Vehicle-Standard'] === 'string'
          ? JSON.parse(empresa['Vehicle-Standard'])
          : empresa['Vehicle-Standard'];
      } catch (e) {
        throw new Error('Erro ao processar lista de veículos da empresa.');
      }

      console.log('🔁 Lista original:', listaAtualizada);

      listaAtualizada = listaAtualizada.map(v => {
        if (v.veiculo === form['MODEL-VEHICLE']) {
          console.log('✏️ Atualizando:', v);
          return {
            ...v,
            veiculo: form['MODEL-VEHICLE'],
            'KM-PERFORMACE': Number(form['KM-PERFORMACE']),
            'LITROS-MAXIMO': Number(form['LITROS-MAXIMO']),
            'ABASTECIMENTO-DISPONIVELE-LITRO': Number(form['ABASTECIMENTO-DISPONIVELE-LITRO'])
          };
        }
        return v;
      });

      console.log('✅ Lista atualizada:', listaAtualizada);

      const payload = {
        Id: empresa.Id,
        'Vehicle-Standard': JSON.stringify(listaAtualizada)
      };

      const res = await axios.patch(`${BASE_URL}/mu0erb59zudhecf/records`, payload, {
        headers: { 'xc-token': TOKEN }
      });

      console.log('🛰️ PATCH empresa enviado:', res.data);
    } else {
      throw new Error('Tipo inválido: deve ser "usuario" ou "empresa".');
    }

    toast({
      title: 'Veículo atualizado com sucesso!',
      status: 'success',
      duration: 3000,
      isClosable: true
    });

    onClose();
    onAtualizado?.();

  } catch (err) {
    console.error('❌ ERRO AO SALVAR:', err);
    toast({
      title: 'Erro ao atualizar veículo',
      description: err.message || 'Ocorreu um erro desconhecido. Verifique os dados e tente novamente.',
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
                type="number" // Garante entrada numérica
              />
            </Box>
            <Box w="100%">
              <FormLabel>Capacidade Máxima de Litros</FormLabel>
              <Input
                placeholder="Capacidade Máxima de Litros"
                name="LITROS-MAXIMO"
                value={form['LITROS-MAXIMO']}
                onChange={handleChange}
                type="number"
              />
            </Box>
            <Box w="100%">
              <FormLabel>Combustível Disponível (Litros)</FormLabel>
              <Input
                placeholder="Combustível Disponível (Litros)"
                name="ABASTECIMENTO-DISPONIVELE-LITRO"
                value={form['ABASTECIMENTO-DISPONIVELE-LITRO']}
                onChange={handleChange}
                type="number"
              />
            </Box>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button
            colorScheme="green"
            onClick={() => {
              console.log('✅ Botão Salvar clicado');
              handleSalvar();
            }}
          >
            Salvar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}