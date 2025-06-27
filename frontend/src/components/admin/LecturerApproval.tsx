import { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Button,
    useToast,
    Spinner,
    Center,
} from '@chakra-ui/react';
import { adminAPI, User } from '@/lib/api';

const LecturerApproval: React.FC = () => {
    const [lecturers, setLecturers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [approvingIds, setApprovingIds] = useState<number[]>([]);
    const toast = useToast();

    const fetchLecturers = useCallback(async () => {
        try {
            const response = await adminAPI.getPendingLecturers();
            setLecturers(response.data);
        } catch {
            toast({
                title: 'Error fetching lecturers',
                description: 'Failed to load pending lecturers',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchLecturers();
    }, [fetchLecturers]);

    const handleApprove = async (lecturerId: number) => {
        // Optimistically remove lecturer from list
        const lecturerToApprove = lecturers.find(l => l.id === lecturerId);
        setLecturers(prev => prev.filter(l => l.id !== lecturerId));
        setApprovingIds(prev => [...prev, lecturerId]);
        try {
            await adminAPI.approveLecturer(lecturerId);
            toast({
                title: 'Lecturer approved',
                description: 'The lecturer has been approved successfully',
                status: 'success',
                duration: 5000,
                isClosable: true,
            });
        } catch {
            // Re-add lecturer if API call fails
            if (lecturerToApprove) {
                setLecturers(prev => [lecturerToApprove, ...prev]);
            }
            toast({
                title: 'Error approving lecturer',
                description: 'Failed to approve lecturer',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setApprovingIds(prev => prev.filter(id => id !== lecturerId));
        }
    };

    if (loading) {
        return (
            <Center h="200px">
                <Spinner size="xl" />
            </Center>
        );
    }

    return (
        <Box overflowX="auto">
            <Table variant="simple">
                <Thead>
                    <Tr>
                        <Th>Name</Th>
                        <Th>Email</Th>
                        <Th>NIDN</Th>
                        <Th>Faculty</Th>
                        <Th>Action</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {lecturers.map((lecturer) => (
                        <Tr key={lecturer.id}>
                            <Td>{lecturer.name}</Td>
                            <Td>{lecturer.email}</Td>
                            <Td>{lecturer.nim_nidn}</Td>
                            <Td>{lecturer.faculty || 'Not assigned'}</Td>
                            <Td>
                                <Button
                                    colorScheme="green"
                                    size="sm"
                                    onClick={() => handleApprove(lecturer.id)}
                                    isLoading={approvingIds.includes(lecturer.id)}
                                    loadingText="Approving..."
                                    disabled={approvingIds.includes(lecturer.id)}
                                >
                                    Approve
                                </Button>
                            </Td>
                        </Tr>
                    ))}
                </Tbody>
            </Table>
        </Box>
    );
};

export default LecturerApproval; 