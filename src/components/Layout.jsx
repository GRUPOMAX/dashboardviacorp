import { Box, Flex, Text, useBreakpointValue } from '@chakra-ui/react';
import Sidebar from './Sidebar';
import BottomBar from './BottomBar';

export default function Layout({ children }) {
  const isMobile = useBreakpointValue({ base: true, md: false });

  return (
    <Flex direction="column" minH="100vh">
      <Flex flex="1" direction={{ base: 'column', md: 'row' }}>
        {!isMobile && <Sidebar />}

        <Box flex="1" p={4} pb={isMobile ? 20 : 4}>
          {children}
        </Box>
      </Flex>

      {isMobile && <BottomBar />}
    </Flex>
  );
}
