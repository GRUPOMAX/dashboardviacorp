import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton,
  ModalBody, ModalFooter, Button, Input, VStack, useToast, Checkbox, Select
} from '@chakra-ui/react';
import { useState } from 'react';
import axios from 'axios';

const BASE_URL = 'https://nocodb.nexusnerds.com.br/api/v2/tables';
const TOKEN = import.meta.env.VITE_NOCODB_TOKEN;

// ...imports mantidos

export default function ModalUsuario({ isOpen, onClose }) {
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    first_nome: '',
    last_nome: '',
    CPF: '',
    email: '',
    password: '',
    usarVeiculoEmpresa: false,
    MODEL_VEHICLE: '',
    KM_PERFORMACE: '',
    LITROS_MAXIMO: '',
    Enterprise: '',
    tipo_abastecimento: ''
  });

  const limparFormulario = () => {
    setForm({
      first_nome: '',
      last_nome: '',
      CPF: '',
      email: '',
      password: '',
      usarVeiculoEmpresa: false,
      MODEL_VEHICLE: '',
      KM_PERFORMACE: '',
      LITROS_MAXIMO: '',
      Enterprise: '',
      tipo_abastecimento: ''
    });
    setStep(1);
  };

  const handleClose = () => {
    limparFormulario();
    onClose();
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAvancar = () => setStep((prev) => prev + 1);
  const handleVoltar = () => setStep((prev) => prev - 1);

  const handleSalvar = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/msehqhsr7j040uq/records?where=(CPF,eq,${form.CPF})`, {
        headers: { 'xc-token': TOKEN }
      });
      if (res.data.list.length > 0) {
        toast({
          title: 'CPF já cadastrado',
          description: 'Já existe um usuário com esse CPF no sistema.',
          status: 'warning',
          duration: 4000,
          isClosable: true
        });
        return;
      }

      const payloadUser = {
        email: form.email,
        password: form.password,
        first_nome: form.first_nome,
        last_nome: form.last_nome,
        model_vehicle: form.MODEL_VEHICLE,
        vehicle: form.usarVeiculoEmpresa ? 'empresa' : form.MODEL_VEHICLE,
        CPF: form.CPF,
        'UnicID-CPF': form.CPF,
        Enterprise: form.Enterprise,
        tipo_abastecimento: form.tipo_abastecimento || ''
      };

      const payloadKM = {
        'UnicID-CPF': form.CPF,
        'KM-CONTROL-SEMANAL': []
      };

      const payloadVehicle = {
        'UnicID-CPF': form.CPF,
        'MODEL-VEHICLE': form.MODEL_VEHICLE,
        'KM-PERFORMACE': Number(form.KM_PERFORMACE),
        'ABASTECIMENTO-DISPONIVELE-LITRO': '',
        'LITROS-MAXIMO': form.LITROS_MAXIMO,
        'ABASTECIMENTO-ZERADO': []
      };

      await axios.post(`${BASE_URL}/msehqhsr7j040uq/records`, payloadUser, {
        headers: { 'xc-token': TOKEN }
      });

      await axios.post(`${BASE_URL}/m0hj8eje9k5w4c0/records`, payloadKM, {
        headers: { 'xc-token': TOKEN }
      });

      if (!form.usarVeiculoEmpresa && form.MODEL_VEHICLE.trim() !== '') {
        await axios.post(`${BASE_URL}/m1sy388a4zv1kgl/records`, payloadVehicle, {
          headers: { 'xc-token': TOKEN }
        });
      }

      toast({
        title: 'Usuário cadastrado com sucesso!',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
      handleClose();
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new Event('usuario-cadastrado'));
      }
    } catch (err) {
      console.error(err);
      toast({
        title: 'Erro ao salvar',
        description: 'Verifique os dados ou tente novamente.',
        status: 'error',
        duration: 4000,
        isClosable: true
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg" isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Novo Usuário - Etapa {step} de 3</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={3}>
            {step === 1 && (
              <>
                <Input placeholder="Primeiro Nome" name="first_nome" value={form.first_nome} onChange={handleChange} />
                <Input placeholder="Sobrenome" name="last_nome" value={form.last_nome} onChange={handleChange} />
                <Input placeholder="CPF" name="CPF" value={form.CPF} onChange={handleChange} />
                <Input placeholder="Email" name="email" value={form.email} onChange={handleChange} />
                <Input placeholder="Senha" name="password" type="password" value={form.password} onChange={handleChange} />
              </>
            )}
            {step === 2 && (
              <>
                <Input placeholder="Modelo do Veículo" name="MODEL_VEHICLE" value={form.MODEL_VEHICLE} onChange={handleChange} />
                <Checkbox name="usarVeiculoEmpresa" isChecked={form.usarVeiculoEmpresa} onChange={handleChange}>
                  Utilizar veículos da empresa
                </Checkbox>
                <Input placeholder="KM por Litro" name="KM_PERFORMACE" value={form.KM_PERFORMACE} onChange={handleChange} />
                <Input placeholder="Capacidade Máxima de Litros" name="LITROS_MAXIMO" value={form.LITROS_MAXIMO} onChange={handleChange} />
                {!form.usarVeiculoEmpresa && form.MODEL_VEHICLE.trim() !== '' && (
                  <Select
                    name="tipo_abastecimento"
                    value={form.tipo_abastecimento}
                    onChange={handleChange}
                    placeholder="Tipo de Abastecimento"
                  >
                    <option value="Gasolina">Gasolina</option>
                    <option value="Álcool">Álcool</option>
                    <option value="Diesel">Diesel</option>
                    <option value="GNV">Gás Natural Veicular</option>
                  </Select>
                )}
              </>
            )}
            {step === 3 && (
              <Select name="Enterprise" value={form.Enterprise} onChange={handleChange} placeholder="Selecione a empresa">
                <option value="max-fibra">Max Fibra</option>
                <option value="agregacao">Agregação</option>
              </Select>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          {step > 1 && (
            <Button variant="ghost" mr={3} onClick={handleVoltar}>
              Voltar
            </Button>
          )}
          {step < 3 ? (
            <Button colorScheme="blue" onClick={handleAvancar}>
              Avançar
            </Button>
          ) : (
            <Button colorScheme="green" onClick={handleSalvar}>
              Salvar
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

