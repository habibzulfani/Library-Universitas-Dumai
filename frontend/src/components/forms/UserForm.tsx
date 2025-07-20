import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    FormControl,
    FormLabel,
    Input,
    Select,
    VStack,
    FormErrorMessage,
    InputGroup,
    InputRightElement,
    IconButton,
    FormHelperText,
    useToast,
} from '@chakra-ui/react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { UserIcon } from '@heroicons/react/24/outline';
import { publicAPI } from '@/lib/api';

interface Department {
    id: number;
    name: string;
}

export interface UserFormData {
    name: string;
    email: string;
    password: string;
    user_type: 'student' | 'lecturer';
    nim_nidn: string;
    faculty: 'Fakultas Ekonomi' | 'Fakultas Ilmu Komputer' | 'Fakultas Hukum';
    department_id: number;
    address?: string;
    role?: 'admin' | 'user';
}

interface UserFormProps {
    initialValues?: Partial<UserFormData>;
    onSubmit: (formData: FormData) => Promise<void>;
    showRole?: boolean;
    showProfilePicture?: boolean;
    showConfirmPassword?: boolean;
    showAddress?: boolean;
    submitLabel?: string;
    loading?: boolean;
}

const defaultValues: UserFormData = {
    name: '',
    email: '',
    password: '',
    user_type: 'student',
    nim_nidn: '',
    faculty: 'Fakultas Ilmu Komputer',
    department_id: 0,
    address: '',
    role: 'user',
};

const UserForm: React.FC<UserFormProps> = ({
    initialValues = {},
    onSubmit,
    showRole = false,
    showProfilePicture = false,
    showConfirmPassword = false,
    showAddress = false,
    submitLabel = 'Register',
    loading = false,
}) => {
    const toast = useToast();
    const [formData, setFormData] = useState<UserFormData>({ ...defaultValues, ...initialValues });
    const [confirmPassword, setConfirmPassword] = useState('');
    const [profilePicture, setProfilePicture] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);

    useEffect(() => {
        const fetchDepartments = async () => {
            setIsLoadingDepartments(true);
            try {
                const response = await publicAPI.getDepartments(formData.faculty);
                setDepartments(response.data);
                setFormData(prev => ({ ...prev, department_id: 0 }));
            } catch (err) {
                toast({
                    title: 'Error',
                    description: 'Failed to load departments',
                    status: 'error',
                    duration: 5000,
                    isClosable: true,
                });
            } finally {
                setIsLoadingDepartments(false);
            }
        };
        if (formData.faculty) fetchDepartments();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.faculty]);

    const validate = () => {
        const newErrors: { [key: string]: string } = {};
        if (!formData.name.trim()) newErrors.name = 'Name is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
        if (!formData.password) newErrors.password = 'Password is required';
        else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
        if (showConfirmPassword && formData.password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
        if (!formData.nim_nidn.trim()) newErrors.nim_nidn = 'NIM/NIDN is required';
        else if (formData.user_type === 'student' && !/^\d{6,}$/.test(formData.nim_nidn)) newErrors.nim_nidn = 'NIM must be at least 6 digits';
        else if (formData.user_type === 'lecturer' && !/^\d{10,}$/.test(formData.nim_nidn)) newErrors.nim_nidn = 'NIDN must be at least 10 digits';
        if (!formData.department_id) newErrors.department_id = 'Department is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'department_id' ? parseInt(value, 10) : value,
        }));
        if (errors[name]) setErrors(prev => { const newErrors = { ...prev }; delete newErrors[name]; return newErrors; });
    };

    const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setProfilePicture(file);
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        const formDataObj = new FormData();
        formDataObj.append('name', formData.name.trim());
        formDataObj.append('email', formData.email.trim());
        formDataObj.append('password', formData.password);
        formDataObj.append('user_type', formData.user_type);
        formDataObj.append('nim_nidn', formData.nim_nidn);
        formDataObj.append('faculty', formData.faculty);
        formDataObj.append('department_id', formData.department_id.toString());
        if (showRole && formData.role) formDataObj.append('role', formData.role);
        if (showAddress && formData.address) formDataObj.append('address', formData.address.trim());
        if (showProfilePicture && profilePicture) formDataObj.append('profile_picture', profilePicture);
        await onSubmit(formDataObj);
    };

    return (
        <Box as="form" onSubmit={handleSubmit} w="100%" maxW="500px" mx="auto">
            <VStack spacing={4} align="stretch">
                {showProfilePicture && (
                    <FormControl>
                        <FormLabel>Profile Picture</FormLabel>
                        <div className="flex items-center space-x-4">
                            <div className="relative h-16 w-16 rounded-full bg-[#38b36c] flex items-center justify-center overflow-hidden">
                                {previewUrl ? (
                                    <Image src={previewUrl} alt="Profile" fill className="object-cover" />
                                ) : (
                                    <UserIcon className="h-8 w-8 text-white" />
                                )}
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleProfilePictureChange}
                                className="hidden"
                                id="profile-picture"
                            />
                            <label
                                htmlFor="profile-picture"
                                className="cursor-pointer bg-[#38b36c] text-white px-4 py-2 rounded-md hover:bg-[#2d8f57] transition-colors"
                            >
                                Upload Photo
                            </label>
                        </div>
                    </FormControl>
                )}
                <FormControl isRequired isInvalid={!!errors.name}>
                    <FormLabel>Name</FormLabel>
                    <Input
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter name"
                        bg="white"
                        border="1px solid"
                        borderColor="gray.300"
                        _hover={{ borderColor: 'gray.400' }}
                        _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px #3182ce' }}
                        _placeholder={{ color: 'gray.500' }}
                    />
                    <FormErrorMessage>{errors.name}</FormErrorMessage>
                </FormControl>
                <FormControl isRequired isInvalid={!!errors.email}>
                    <FormLabel>Email</FormLabel>
                    <Input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter email"
                        bg="white"
                        border="1px solid"
                        borderColor="gray.300"
                        _hover={{ borderColor: 'gray.400' }}
                        _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px #3182ce' }}
                        _placeholder={{ color: 'gray.500' }}
                    />
                    <FormErrorMessage>{errors.email}</FormErrorMessage>
                </FormControl>
                <FormControl isRequired isInvalid={!!errors.password}>
                    <FormLabel>Password</FormLabel>
                    <InputGroup>
                        <Input
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Enter password"
                            bg="white"
                            border="1px solid"
                            borderColor="gray.300"
                            _hover={{ borderColor: 'gray.400' }}
                            _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px #3182ce' }}
                            _placeholder={{ color: 'gray.500' }}
                        />
                        <InputRightElement>
                            <IconButton
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                icon={showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                onClick={() => setShowPassword(!showPassword)}
                                variant="ghost"
                            />
                        </InputRightElement>
                    </InputGroup>
                    <FormHelperText>Password must be at least 6 characters long.</FormHelperText>
                    <FormErrorMessage>{errors.password}</FormErrorMessage>
                </FormControl>
                {showConfirmPassword && (
                    <FormControl isRequired isInvalid={!!errors.confirmPassword}>
                        <FormLabel>Confirm Password</FormLabel>
                        <InputGroup>
                            <Input
                                type={showConfirm ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                placeholder="Confirm password"
                                bg="white"
                                border="1px solid"
                                borderColor="gray.300"
                                _hover={{ borderColor: 'gray.400' }}
                                _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px #3182ce' }}
                                _placeholder={{ color: 'gray.500' }}
                            />
                            <InputRightElement>
                                <IconButton
                                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                                    icon={showConfirm ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                    onClick={() => setShowConfirm(!showConfirm)}
                                    variant="ghost"
                                />
                            </InputRightElement>
                        </InputGroup>
                        <FormErrorMessage>{errors.confirmPassword}</FormErrorMessage>
                    </FormControl>
                )}
                <FormControl isRequired>
                    <FormLabel>Occupation</FormLabel>
                    <Select
                        name="user_type"
                        value={formData.user_type}
                        onChange={handleChange}
                        bg="white"
                        border="1px solid"
                        borderColor="gray.300"
                        _hover={{ borderColor: 'gray.400' }}
                        _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px #3182ce' }}
                    >
                        <option value="student">Student</option>
                        <option value="lecturer">Lecturer</option>
                    </Select>
                </FormControl>
                <FormControl isRequired isInvalid={!!errors.nim_nidn}>
                    <FormLabel>{formData.user_type === 'student' ? 'NIM' : 'NIDN'}</FormLabel>
                    <Input
                        name="nim_nidn"
                        value={formData.nim_nidn}
                        onChange={handleChange}
                        placeholder={`Enter ${formData.user_type === 'student' ? 'NIM' : 'NIDN'}`}
                        bg="white"
                        border="1px solid"
                        borderColor="gray.300"
                        _hover={{ borderColor: 'gray.400' }}
                        _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px #3182ce' }}
                        _placeholder={{ color: 'gray.500' }}
                    />
                    <FormErrorMessage>{errors.nim_nidn}</FormErrorMessage>
                </FormControl>
                <FormControl isRequired>
                    <FormLabel>Faculty</FormLabel>
                    <Select
                        name="faculty"
                        value={formData.faculty}
                        onChange={handleChange}
                        bg="white"
                        border="1px solid"
                        borderColor="gray.300"
                        _hover={{ borderColor: 'gray.400' }}
                        _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px #3182ce' }}
                    >
                        <option value="Fakultas Ekonomi">Fakultas Ekonomi</option>
                        <option value="Fakultas Ilmu Komputer">Fakultas Ilmu Komputer</option>
                        <option value="Fakultas Hukum">Fakultas Hukum</option>
                    </Select>
                </FormControl>
                <FormControl isRequired isInvalid={!!errors.department_id}>
                    <FormLabel>Department</FormLabel>
                    <Select
                        name="department_id"
                        value={formData.department_id}
                        onChange={handleChange}
                        isDisabled={isLoadingDepartments}
                        bg="white"
                        border="1px solid"
                        borderColor="gray.300"
                        _hover={{ borderColor: 'gray.400' }}
                        _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px #3182ce' }}
                    >
                        <option value="">Select Department</option>
                        {departments.map((dept: Department) => (
                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                        ))}
                    </Select>
                    <FormErrorMessage>{errors.department_id}</FormErrorMessage>
                </FormControl>
                {showAddress && (
                    <FormControl>
                        <FormLabel>Address</FormLabel>
                        <Input
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="Enter address..."
                            bg="white"
                            border="1px solid"
                            borderColor="gray.300"
                            _hover={{ borderColor: 'gray.400' }}
                            _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px #3182ce' }}
                            _placeholder={{ color: 'gray.500' }}
                        />
                    </FormControl>
                )}
                {showRole && (
                    <FormControl isRequired>
                        <FormLabel>Role</FormLabel>
                        <Select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            bg="white"
                            border="1px solid"
                            borderColor="gray.300"
                            _hover={{ borderColor: 'gray.400' }}
                            _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px #3182ce' }}
                        >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </Select>
                    </FormControl>
                )}
                <Button
                    type="submit"
                    colorScheme="green"
                    width="full"
                    isLoading={loading}
                >
                    {submitLabel}
                </Button>
            </VStack>
        </Box>
    );
};

export default UserForm; 