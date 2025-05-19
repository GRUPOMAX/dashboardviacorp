import { Box, Flex, Text } from '@chakra-ui/react';
import Sidebar from './Sidebar';

export default function Layout({ children }) {
  return (
    <Flex>
      <Sidebar />
      <Box flex="1" p={4}>
        {children}
      </Box>
    </Flex>
  );
}
