import { useEffect, useState } from 'react';
import {
  Box, Heading, Table, Thead, Tbody, Tr, Th, Td, Spinner, Text, IconButton, useToast,
  Button, useDisclosure
} from '@chakra-ui/react';
import { DeleteIcon, EditIcon } from '@chakra-ui/icons';
import {
  listarUsuarios,
  deletarUsuario,
  criarUsuario,
  atualizarUsuario
} from '../services/api';
import ModalUsuario from '../components/ModalUsuario';
import ModalEditarUsuario from '../components/ModalEditarUsuario';

const BASE_URL = 'https://nocodb.nexusnerds.com.br/api/v2/tables';
const TOKEN = import.meta.env.VITE_NOCODB_TOKEN;

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [modoEdicao, setModoEdicao] = useState(false);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const carregar = async () => {
    try {
      setCarregando(true);
      const data = await listarUsuarios();
      setUsuarios(data);
    } catch (e) {
      toast({ title: 'Erro ao carregar usuários', status: 'error' });
    } finally {
      setCarregando(false);
    }
  };

  const salvar = async (dados) => {
    try {
      if (dados.Id) {
        await atualizarUsuario(dados.Id, dados);

        const cpfNovo = dados['UnicID-CPF'];
        const cpfAntigo = usuarios.find(u => u.Id === dados.Id)?.['UnicID-CPF'];

        if (cpfAntigo && cpfAntigo !== cpfNovo) {
          for (const tableId of ['m0hj8eje9k5w4c0', 'm1sy388a4zv1kgl']) {
            const res = await fetch(`${BASE_URL}/${tableId}/records?where=(UnicID-CPF,eq,${cpfAntigo})`, {
              headers: { 'xc-token': TOKEN }
            });
            const dados = await res.json();
            for (const reg of dados.list) {
              await fetch(`${BASE_URL}/${tableId}/records`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                  'xc-token': TOKEN
                },
                body: JSON.stringify({ Id: reg.Id, 'UnicID-CPF': cpfNovo })
              });
            }
          }
        }

        toast({ title: 'Usuário atualizado', status: 'success' });
      } else {
        await criarUsuario(dados);
        toast({ title: 'Usuário criado', status: 'success' });
      }
      onClose();
      setUsuarioEditando(null);
      setModoEdicao(false);
      carregar();
    } catch (e) {
      toast({ title: 'Erro ao salvar usuário', status: 'error' });
    }
  };

  useEffect(() => {
    carregar();
    const atualizarAoSalvar = () => carregar();
    window.addEventListener('usuario-cadastrado', atualizarAoSalvar);
    return () => {
      window.removeEventListener('usuario-cadastrado', atualizarAoSalvar);
    };
  }, []);

  const removerUsuario = async (id) => {
    try {
      const usuario = usuarios.find(u => u.Id === id);
      const cpf = usuario?.['UnicID-CPF'];

      if (!cpf) {
        toast({ title: 'CPF não encontrado', status: 'error' });
        return;
      }

      await deletarUsuario(id);

      for (const tableId of ['m0hj8eje9k5w4c0', 'm1sy388a4zv1kgl']) {
        const res = await fetch(`${BASE_URL}/${tableId}/records?where=(UnicID-CPF,eq,${cpf})`, {
          headers: { 'xc-token': TOKEN }
        });
        const dados = await res.json();
        for (const reg of dados.list) {
          await fetch(`${BASE_URL}/${tableId}/records`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'xc-token': TOKEN
            },
            body: JSON.stringify({ Id: reg.Id })
          });
        }
      }

      toast({ title: 'Usuário e dados vinculados deletados com sucesso', status: 'success' });
      carregar();
    } catch (e) {
      console.error(e);
      toast({ title: 'Erro ao deletar usuário', status: 'error' });
    }
  };

  return (
    <Box>
      <Heading size="lg" mb={4}>Usuários</Heading>
      <Button colorScheme="blue" mb={4} onClick={() => { setUsuarioEditando(null); setModoEdicao(false); onOpen(); }}>
        Novo Usuário
      </Button>

      {carregando ? (
        <Spinner />
      ) : usuarios.length === 0 ? (
        <Text>Nenhum usuário encontrado.</Text>
      ) : (
        <Table variant="striped" size="sm">
          <Thead>
            <Tr>
              <Th>Nome</Th>
              <Th>Email</Th>
              <Th>Veículo</Th>
              <Th>Empresa</Th>
              <Th>Ações</Th>
            </Tr>
          </Thead>
          <Tbody>
            {usuarios.map((user) => (
              <Tr key={user.Id}>
                <Td>{user.first_nome} {user.last_nome}</Td>
                <Td>{user.email}</Td>
                <Td>{user.vehicle}</Td>
                <Td>{user.Enterprise}</Td>
                <Td>
                  <IconButton
                    size="sm"
                    colorScheme="blue"
                    icon={<EditIcon />}
                    mr={2}
                    onClick={() => {
                      setUsuarioEditando(user);
                      setModoEdicao(true);
                      onOpen();
                    }}
                    aria-label="Editar"
                  />
                  <IconButton
                    size="sm"
                    colorScheme="red"
                    icon={<DeleteIcon />}
                    onClick={() => removerUsuario(user.Id)}
                    aria-label="Deletar"
                  />
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}

      {!modoEdicao ? (
        <ModalUsuario
          isOpen={isOpen}
          onClose={onClose}
          onSalvar={salvar}
          dados={usuarioEditando}
        />
      ) : (
        <ModalEditarUsuario
          isOpen={isOpen}
          onClose={() => { setModoEdicao(false); onClose(); }}
          dados={usuarioEditando}
          onAtualizado={carregar}
        />
      )}
    </Box>
  );
}