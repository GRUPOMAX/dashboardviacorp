import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton,
  ModalBody, ModalFooter, Button, Input, VStack, useToast, Checkbox, Select
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import axios from 'axios';

const BASE_URL = 'https://nocodb.nexusnerds.com.br/api/v2/tables';
const TOKEN = import.meta.env.VITE_NOCODB_TOKEN;

export default function ModalEditarUsuario({ isOpen, onClose, dados, onAtualizado }) {
  const toast = useToast();
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
    tipo_abastecimento: '',
    Id: null
  });

  useEffect(() => {
    if (dados) {
      setForm({
        first_nome: dados.first_nome || '',
        last_nome: dados.last_nome || '',
        CPF: dados.CPF || '',
        email: dados.email || '',
        password: dados.password || '',
        usarVeiculoEmpresa: dados.vehicle === 'empresa',
        MODEL_VEHICLE: dados.model_vehicle || '',
        KM_PERFORMACE: '',
        LITROS_MAXIMO: '',
        Enterprise: dados.Enterprise || '',
        tipo_abastecimento: dados.tipo_abastecimento || '',
        Id: dados.Id || null
      });
    }
  }, [dados]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const atualizarCPFEmTabelasRelacionadas = async (cpfAntigo, cpfNovo) => {
    const tabelas = ['m0hj8eje9k5w4c0', 'm1sy388a4zv1kgl'];
    for (const tabela of tabelas) {
      const res = await fetch(`${BASE_URL}/${tabela}/records?where=(UnicID-CPF,eq,${cpfAntigo})`, {
        headers: { 'xc-token': TOKEN }
      });
      const data = await res.json();
      for (const reg of data.list) {
        await fetch(`${BASE_URL}/${tabela}/records`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'xc-token': TOKEN
          },
          body: JSON.stringify({ Id: reg.Id, 'UnicID-CPF': cpfNovo })
        });
      }
    }
  };

  const handleSalvar = async () => {
    const payload = {
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

    try {
      const cpfAntigo = dados?.['UnicID-CPF'];
      const cpfNovo = form.CPF;

      await axios.patch(`${BASE_URL}/msehqhsr7j040uq/records`, { Id: form.Id, ...payload }, {
        headers: { 'xc-token': TOKEN }
      });

      if (cpfAntigo && cpfAntigo !== cpfNovo) {
        await atualizarCPFEmTabelasRelacionadas(cpfAntigo, cpfNovo);
      }

      toast({ title: 'Usuário atualizado com sucesso!', status: 'success', duration: 3000, isClosable: true });
      onClose();
      onAtualizado();
    } catch (err) {
      console.error(err);
      toast({ title: 'Erro ao atualizar usuário', status: 'error', duration: 3000, isClosable: true });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Editar Usuário</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={3}>
            <Input placeholder="Primeiro Nome" name="first_nome" value={form.first_nome} onChange={handleChange} />
            <Input placeholder="Sobrenome" name="last_nome" value={form.last_nome} onChange={handleChange} />
            <Input placeholder="CPF" name="CPF" value={form.CPF} onChange={handleChange} />
            <Input placeholder="Email" name="email" value={form.email} onChange={handleChange} />
            <Input placeholder="Senha" name="password" type="password" value={form.password} onChange={handleChange} />
            <Input placeholder="Modelo do Veículo" name="MODEL_VEHICLE" value={form.MODEL_VEHICLE} onChange={handleChange} />
            <Checkbox name="usarVeiculoEmpresa" isChecked={form.usarVeiculoEmpresa} onChange={handleChange}>Usar veículo da empresa</Checkbox>
            <Select name="tipo_abastecimento" value={form.tipo_abastecimento} onChange={handleChange} placeholder="Tipo de Abastecimento">
              <option value="Gasolina">Gasolina</option>
              <option value="Álcool">Álcool</option>
              <option value="Diesel">Diesel</option>
              <option value="GNV">GNV</option>
            </Select>
            <Select name="Enterprise" value={form.Enterprise} onChange={handleChange} placeholder="Empresa">
              <option value="max-fibra">Max Fibra</option>
              <option value="agregacao">Agregação</option>
            </Select>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="green" onClick={handleSalvar}>Salvar Alterações</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}