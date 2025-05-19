import {
  Box,
  VStack,
  Text,
  Icon,
  Flex,
  Image,
  IconButton
} from '@chakra-ui/react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FiUsers,
  FiMap,
  FiTruck,
  FiChevronLeft,
  FiChevronRight,
  FiLogOut
} from 'react-icons/fi';
import { useState } from 'react';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);
  const isActive = (path) => location.pathname === path;

  const menu = [
    { label: 'Usuários', path: '/usuarios', icon: FiUsers },
    { label: 'Registros de KM', path: '/registros-km', icon: FiMap },
    { label: 'Painel de Abastecimento', path: '/painel-abastecimento', icon: FiTruck },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  return (
    <Box
      w={isCollapsed ? '80px' : '250px'}
      h="100vh"
      bg="white"
      borderRight="1px solid"
      borderColor="gray.200"
      transition="width 0.3s ease"
      px={isCollapsed ? 3 : 6}
      py={6}
      position="relative"
      display="flex"
      flexDirection="column"
      justifyContent="space-between"
    >
      <Box>
        {/* Botão de retração */}
        <IconButton
          icon={isCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
          size="sm"
          aria-label="Retrair"
          onClick={toggleSidebar}
          position="absolute"
          top={4}
          right={isCollapsed ? 2 : -4}
          variant="ghost"
        />

        {/* Logo */}
        <Box mb={10} textAlign="center">
          {isCollapsed ? (
            <Image
              src="/logo-retratil.png"
              alt="Logo retraída"
              boxSize="36px"
              mx="auto"
            />
          ) : (
            <>
              <Image
                src="/logo-viaCorp.png"
                alt="ViaCorp"
                maxW="120px"
                mx="auto"
                mb={2}
              />
              <Text fontSize="sm" fontWeight="semibold" color="gray.600">ViaCorp</Text>
            </>
          )}
        </Box>

        {/* Menu */}
        <VStack spacing={3} align="stretch">
          {menu.map((item) => {
            const active = isActive(item.path);
            return (
              <Flex
                key={item.path}
                align="center"
                bg={active ? 'gray.100' : 'transparent'}
                borderRadius="xl"
                px={3}
                py={3}
                cursor="pointer"
                transition="all 0.2s"
                _hover={{ bg: 'gray.50', boxShadow: 'sm' }}
                onClick={() => navigate(item.path)}
                role="group"
                justify={isCollapsed ? 'center' : 'flex-start'}
              >
                <Icon
                  as={item.icon}
                  boxSize={5}
                  color="gray.700"
                  mr={isCollapsed ? 0 : 3}
                />
                {!isCollapsed && (
                  <Text fontWeight="medium" color="gray.800">{item.label}</Text>
                )}
              </Flex>
            );
          })}
        </VStack>
      </Box>

      {/* Botão de logout */}
      <Box mt={10}>
        <Flex
          align="center"
          borderRadius="xl"
          px={3}
          py={3}
          cursor="pointer"
          transition="all 0.2s"
          _hover={{ bg: 'red.50' }}
          onClick={handleLogout}
          justify={isCollapsed ? 'center' : 'flex-start'}
        >
          <Icon
            as={FiLogOut}
            boxSize={5}
            color="red.500"
            mr={isCollapsed ? 0 : 3}
          />
          {!isCollapsed && (
            <Text fontWeight="medium" color="red.500">Sair</Text>
          )}
        </Flex>
      </Box>
    </Box>
  );
}
