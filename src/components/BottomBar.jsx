import {
  Box,
  IconButton,
  HStack,
  useColorModeValue,
  Tooltip
} from '@chakra-ui/react';
import {
  FiUsers,
  FiMap,
  FiTruck,
  FiLogOut,
  FiList,
  FiMapPin
} from 'react-icons/fi';
import { useLocation, useNavigate } from 'react-router-dom';

export default function BottomBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const activeColor = useColorModeValue('blue.500', 'blue.300');

  const menu = [
    { icon: FiUsers, path: '/usuarios', label: 'Usuários' },
    { icon: FiMap, path: '/registros-km', label: 'KM' },
    { icon: FiTruck, path: '/painel-abastecimento', label: 'Abastecimento' },
    { icon: FiList, path: '/lista-abastecimentos', label: 'Lista Abastecimento' },
    { icon: FiMapPin, path: '/mapa-tempo-real', label: 'Mapa em Tempo Real' }
  ];

  const handleClick = (path) => {
    if (path === '/logout') {
      localStorage.removeItem('token');
      window.location.href = '/';
    } else {
      navigate(path);
    }
  };

  return (
    <Box
      position="fixed"
      bottom="0"
      left="0"
      right="0"
      bg="white"
      borderTop="1px solid #ddd"
      zIndex="999"
      px={4}
      py={2}
      boxShadow="md"
    >
      <HStack justify="space-around">
        {menu.map(({ icon, path, label }) => {
          const isActive = location.pathname === path;
          return (
            <Tooltip label={label} key={path}>
              <IconButton
                icon={icon({})}
                aria-label={label}
                variant="ghost"
                color={isActive ? activeColor : 'gray.600'}
                onClick={() => handleClick(path)}
                fontSize="20px"
              />
            </Tooltip>
          );
        })}

        <Tooltip label="Sair">
          <IconButton
            icon={<FiLogOut />}
            aria-label="Sair"
            variant="ghost"
            color={'red.500'}
            onClick={() => handleClick('/logout')}
            fontSize="20px"
          />
        </Tooltip>
      </HStack>
    </Box>
  );
}
