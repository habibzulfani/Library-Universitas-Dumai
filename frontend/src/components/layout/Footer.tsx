'use client';

import {
    Box,
    Container,
    Stack,
    Text,
    Link,
    useColorModeValue,
    Divider,
    SimpleGrid,
    Heading,
    Icon,
    HStack,
    VStack,
} from '@chakra-ui/react';
import {
    FaFacebook,
    FaTwitter,
    FaInstagram,
    FaLinkedin,
    FaYoutube,
    FaEnvelope,
    FaPhone,
    FaMapMarkerAlt,
} from 'react-icons/fa';

const Footer = () => {
    const bgColor = useColorModeValue('gray.50', 'gray.900');
    const borderColor = useColorModeValue('gray.200', 'gray.700');
    const textColor = useColorModeValue('gray.600', 'gray.400');

    const socialLinks = [
        { icon: FaFacebook, href: '#', label: 'Facebook' },
        { icon: FaTwitter, href: '#', label: 'Twitter' },
        { icon: FaInstagram, href: '#', label: 'Instagram' },
        { icon: FaLinkedin, href: '#', label: 'LinkedIn' },
        { icon: FaYoutube, href: '#', label: 'YouTube' },
    ];

    const contactInfo = [
        { icon: FaEnvelope, text: 'info@uniduma.ac.id', href: 'mailto:info@uniduma.ac.id' },
        { icon: FaPhone, text: '+62 765 123456', href: 'tel:+62765123456' },
        { icon: FaMapMarkerAlt, text: 'Jl. Lintas Timur, Dumai, Riau', href: '#' },
    ];

    return (
        <Box bg={bgColor} borderTop="1px" borderColor={borderColor} mt="auto">
            <Container maxW="container.xl" py={10}>
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
                    {/* About Us Section */}
                    <VStack align="start" spacing={4}>
                        <Heading size="md" color={useColorModeValue('gray.800', 'white')}>
                            Tentang Kami
                        </Heading>
                        <Text color={textColor} lineHeight="tall">
                            E-Repository Universitas Dumai adalah platform digital yang menyediakan akses
                            ke karya ilmiah, buku-buku akademik, dan penelitian dari mahasiswa dan dosen
                            Universitas Dumai.
                        </Text>
                        <Text color={textColor} fontSize="sm">
                            Menyediakan akses terbuka ke pengetahuan akademik untuk kemajuan pendidikan
                            dan penelitian di Indonesia.
                        </Text>
                    </VStack>

                    {/* Contact Us Section */}
                    <VStack align="start" spacing={4}>
                        <Heading size="md" color={useColorModeValue('gray.800', 'white')}>
                            Hubungi Kami
                        </Heading>
                        <VStack align="start" spacing={3}>
                            {contactInfo.map((contact, index) => (
                                <HStack key={index} spacing={3}>
                                    <Icon as={contact.icon} color="blue.500" />
                                    <Link
                                        href={contact.href}
                                        color={textColor}
                                        _hover={{ color: 'blue.500' }}
                                        fontSize="sm"
                                    >
                                        {contact.text}
                                    </Link>
                                </HStack>
                            ))}
                        </VStack>
                    </VStack>

                    {/* Social Media Section */}
                    <VStack align="start" spacing={4}>
                        <Heading size="md" color={useColorModeValue('gray.800', 'white')}>
                            Ikuti Kami
                        </Heading>
                        <Text color={textColor} fontSize="sm">
                            Ikuti media sosial kami untuk mendapatkan informasi terbaru tentang
                            kegiatan akademik dan penelitian.
                        </Text>
                        <HStack spacing={4}>
                            {socialLinks.map((social, index) => (
                                <Link
                                    key={index}
                                    href={social.href}
                                    aria-label={social.label}
                                    _hover={{ transform: 'translateY(-2px)' }}
                                    transition="all 0.2s"
                                >
                                    <Icon
                                        as={social.icon}
                                        w={6}
                                        h={6}
                                        color={textColor}
                                        _hover={{ color: 'blue.500' }}
                                    />
                                </Link>
                            ))}
                        </HStack>
                    </VStack>
                </SimpleGrid>

                <Divider my={8} borderColor={borderColor} />

                {/* Bottom Section */}
                <Stack
                    direction={{ base: 'column', md: 'row' }}
                    justify="space-between"
                    align="center"
                    spacing={4}
                >
                    <Text color={textColor} fontSize="sm">
                        © {new Date().getFullYear()} E-Repository Universitas Dumai.
                        Semua hak cipta dilindungi.
                    </Text>
                    <Stack direction="row" spacing={6}>
                        <Link href="#" color={textColor} fontSize="sm" _hover={{ color: 'blue.500' }}>
                            Kebijakan Privasi
                        </Link>
                        <Link href="#" color={textColor} fontSize="sm" _hover={{ color: 'blue.500' }}>
                            Syarat & Ketentuan
                        </Link>
                        <Link href="#" color={textColor} fontSize="sm" _hover={{ color: 'blue.500' }}>
                            Peta Situs
                        </Link>
                    </Stack>
                </Stack>
            </Container>
        </Box>
    );
};

export default Footer; 