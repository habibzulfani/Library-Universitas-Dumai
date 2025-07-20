import React, { useState } from 'react';
import {
    Box,
    Button,
    VStack,
    HStack,
    Text,
    Progress,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
    useToast,
    Badge,
    Collapse,
    IconButton,
    Tooltip,
} from '@chakra-ui/react';
import { DocumentArrowUpIcon, SparklesIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { publicAPI } from '@/lib/api';

interface ExtractedMetadata {
    title: string;
    authors: string[];
    abstract: string;
    keywords: string[];
    journal: string;
    publisher: string;
    year: number;
    volume: string;
    issue: string;
    pages: string;
    doi: string;
    isbn: string;
    issn: string;
    language: string;
    subject: string;
    university: string;
    department: string;
    advisor: string;
    document_type: string;
    confidence: number;
}

interface MetadataExtractorProps {
    onMetadataExtracted: (metadata: ExtractedMetadata, file?: File) => void;
    disabled?: boolean;
}

const MetadataExtractor: React.FC<MetadataExtractorProps> = ({
    onMetadataExtracted,
    disabled = false,
}) => {
    const toast = useToast();
    const [isExtracting, setIsExtracting] = useState(false);
    const [extractedMetadata, setExtractedMetadata] = useState<ExtractedMetadata | null>(null);
    const [showResults, setShowResults] = useState(false);
    const [progress, setProgress] = useState(0);
    const [uploadedFile, setUploadedFile] = useState<File | undefined>(undefined);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploadedFile(file);

        // Validate file type
        const allowedTypes = ['.pdf', '.doc', '.docx', '.txt', '.html', '.htm'];
        const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

        if (!allowedTypes.includes(fileExtension)) {
            toast({
                title: 'Invalid file type',
                description: `Please upload a ${allowedTypes.join(', ')} file`,
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
            return;
        }

        // Validate file size (50MB limit)
        if (file.size > 50 * 1024 * 1024) {
            toast({
                title: 'File too large',
                description: 'Please upload a file smaller than 50MB',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
            return;
        }

        setIsExtracting(true);
        setProgress(0);
        setExtractedMetadata(null);
        setShowResults(false);

        try {
            // Simulate progress
            const progressInterval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    return prev + 10;
                });
            }, 200);

            const formData = new FormData();
            formData.append('file', file);

            const response = await publicAPI.extractMetadata(formData);

            clearInterval(progressInterval);
            setProgress(100);

            const metadata = response.data;
            setExtractedMetadata(metadata);
            setShowResults(true);

            toast({
                title: 'Metadata extracted successfully!',
                description: `Confidence: ${Math.round(metadata.confidence * 100)}%`,
                status: 'success',
                duration: 5000,
                isClosable: true,
            });

        } catch (error: any) {
            console.error('Metadata extraction error:', error);
            toast({
                title: 'Extraction failed',
                description: error.response?.data?.error || 'Failed to extract metadata from file',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsExtracting(false);
            setProgress(0);
        }
    };

    const handleApplyMetadata = () => {
        alert('Apply button clicked!'); // Temporary debug alert
        console.log('Apply button clicked, extractedMetadata:', extractedMetadata);
        if (extractedMetadata) {
            // If extractedMetadata has a 'data' property, pass that, otherwise pass the object itself
            const metadataToPass = (extractedMetadata as any).data ? (extractedMetadata as any).data : extractedMetadata;
            console.log('Calling onMetadataExtracted with:', metadataToPass);
            onMetadataExtracted(metadataToPass, uploadedFile); // Pass the file as second argument
            toast({
                title: 'Metadata applied!',
                description: 'Form fields have been filled with extracted data',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
        } else {
            console.log('No extracted metadata available');
            toast({
                title: 'No metadata extracted',
                description: 'Please upload a file and extract metadata first',
                status: 'warning',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const handleClearResults = () => {
        setExtractedMetadata(null);
        setShowResults(false);
    };

    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 0.8) return 'green';
        if (confidence >= 0.6) return 'yellow';
        return 'red';
    };

    const getConfidenceText = (confidence: number) => {
        if (confidence >= 0.8) return 'High';
        if (confidence >= 0.6) return 'Medium';
        return 'Low';
    };

    return (
        <Box w="100%">
            <VStack spacing={4} align="stretch">
                {/* File Upload Section */}
                <Box
                    border="2px dashed"
                    borderColor="gray.300"
                    borderRadius="lg"
                    p={6}
                    textAlign="center"
                    bg="gray.50"
                    _hover={{ borderColor: 'blue.400', bg: 'blue.50' }}
                    transition="all 0.2s"
                >
                    <input
                        type="file"
                        accept=".pdf,.doc,.docx,.txt,.html,.htm"
                        onChange={handleFileUpload}
                        disabled={disabled || isExtracting}
                        style={{ display: 'none' }}
                        id="metadata-file-upload"
                    />
                    <label htmlFor="metadata-file-upload">
                        <VStack spacing={3} cursor="pointer">
                            <DocumentArrowUpIcon className="h-12 w-12 text-gray-400" />
                            <Box>
                                <Text fontSize="lg" fontWeight="semibold" color="gray.700">
                                    {isExtracting ? 'Extracting metadata...' : 'Upload document for metadata extraction'}
                                </Text>
                                <Text fontSize="sm" color="gray.500" mt={1}>
                                    Supports PDF, Word, Text, and HTML files (max 50MB)
                                </Text>
                            </Box>
                            {!isExtracting && (
                                <Button
                                    leftIcon={<SparklesIcon className="h-5 w-5" />}
                                    colorScheme="blue"
                                    variant="outline"
                                    size="sm"
                                    disabled={disabled}
                                >
                                    Extract Metadata
                                </Button>
                            )}
                        </VStack>
                    </label>
                </Box>

                {/* Progress Bar */}
                {isExtracting && (
                    <Box>
                        <Text fontSize="sm" color="gray.600" mb={2}>
                            Analyzing document...
                        </Text>
                        <Progress
                            value={progress}
                            colorScheme="blue"
                            size="sm"
                            borderRadius="full"
                        />
                    </Box>
                )}

                {/* Results Section */}
                <Collapse in={showResults} animateOpacity>
                    <Box
                        border="1px solid"
                        borderColor="gray.200"
                        borderRadius="lg"
                        p={4}
                        bg="white"
                    >
                        <HStack justify="space-between" mb={3}>
                            <HStack>
                                <SparklesIcon className="h-5 w-5 text-green-500" />
                                <Text fontWeight="semibold">Extracted Metadata</Text>
                                <Badge
                                    colorScheme={getConfidenceColor(extractedMetadata?.confidence || 0)}
                                    variant="subtle"
                                >
                                    {getConfidenceText(extractedMetadata?.confidence || 0)} Confidence
                                </Badge>
                            </HStack>
                            <Tooltip label="Clear results">
                                <IconButton
                                    aria-label="Clear results"
                                    icon={<XMarkIcon className="h-4 w-4" />}
                                    size="sm"
                                    variant="ghost"
                                    onClick={handleClearResults}
                                />
                            </Tooltip>
                        </HStack>

                        {extractedMetadata && (
                            <VStack spacing={3} align="stretch">
                                {/* Document Type */}
                                <Box>
                                    <Text fontSize="sm" fontWeight="medium" color="gray.600">
                                        Document Type
                                    </Text>
                                    <Text fontSize="md" textTransform="capitalize">
                                        {extractedMetadata.document_type}
                                    </Text>
                                </Box>

                                {/* Title */}
                                {extractedMetadata.title && (
                                    <Box>
                                        <Text fontSize="sm" fontWeight="medium" color="gray.600">
                                            Title
                                        </Text>
                                        <Text fontSize="md">{extractedMetadata.title}</Text>
                                    </Box>
                                )}

                                {/* Authors */}
                                {extractedMetadata.authors && extractedMetadata.authors.length > 0 && (
                                    <Box>
                                        <Text fontSize="sm" fontWeight="medium" color="gray.600">
                                            Authors
                                        </Text>
                                        <Text fontSize="md">{extractedMetadata.authors.join(', ')}</Text>
                                    </Box>
                                )}

                                {/* Abstract */}
                                {extractedMetadata.abstract && (
                                    <Box>
                                        <Text fontSize="sm" fontWeight="medium" color="gray.600">
                                            Abstract
                                        </Text>
                                        <Text fontSize="md" noOfLines={3}>
                                            {extractedMetadata.abstract}
                                        </Text>
                                    </Box>
                                )}

                                {/* Keywords */}
                                {extractedMetadata.keywords && extractedMetadata.keywords.length > 0 && (
                                    <Box>
                                        <Text fontSize="sm" fontWeight="medium" color="gray.600">
                                            Keywords
                                        </Text>
                                        <HStack flexWrap="wrap" spacing={1}>
                                            {extractedMetadata.keywords.map((keyword, index) => (
                                                <Badge key={index} colorScheme="blue" variant="subtle">
                                                    {keyword}
                                                </Badge>
                                            ))}
                                        </HStack>
                                    </Box>
                                )}

                                {/* Additional metadata in a compact format */}
                                <Box>
                                    <Text fontSize="sm" fontWeight="medium" color="gray.600" mb={2}>
                                        Additional Information
                                    </Text>
                                    <VStack spacing={1} align="stretch">
                                        {extractedMetadata.year && (
                                            <Text fontSize="sm">Year: {extractedMetadata.year}</Text>
                                        )}
                                        {extractedMetadata.journal && (
                                            <Text fontSize="sm">Journal: {extractedMetadata.journal}</Text>
                                        )}
                                        {extractedMetadata.publisher && (
                                            <Text fontSize="sm">Publisher: {extractedMetadata.publisher}</Text>
                                        )}
                                        {extractedMetadata.doi && (
                                            <Text fontSize="sm">DOI: {extractedMetadata.doi}</Text>
                                        )}
                                        {extractedMetadata.isbn && (
                                            <Text fontSize="sm">ISBN: {extractedMetadata.isbn}</Text>
                                        )}
                                        {extractedMetadata.issn && (
                                            <Text fontSize="sm">ISSN: {extractedMetadata.issn}</Text>
                                        )}
                                        {extractedMetadata.university && (
                                            <Text fontSize="sm">University: {extractedMetadata.university}</Text>
                                        )}
                                        {extractedMetadata.department && (
                                            <Text fontSize="sm">Department: {extractedMetadata.department}</Text>
                                        )}
                                        {extractedMetadata.advisor && (
                                            <Text fontSize="sm">Advisor: {extractedMetadata.advisor}</Text>
                                        )}
                                    </VStack>
                                </Box>

                                {/* Apply Button */}
                                <Button
                                    colorScheme="green"
                                    leftIcon={<SparklesIcon className="h-4 w-4" />}
                                    onClick={handleApplyMetadata}
                                    size="sm"
                                >
                                    Apply to Form
                                </Button>
                            </VStack>
                        )}
                    </Box>
                </Collapse>

                {/* Info Alert */}
                <Alert status="info" borderRadius="md">
                    <AlertIcon />
                    <Box>
                        <AlertTitle>How it works</AlertTitle>
                        <AlertDescription>
                            Upload your document and our AI will automatically extract metadata like title, authors,
                            abstract, and more. This feature works best with well-formatted academic documents.
                        </AlertDescription>
                    </Box>
                </Alert>
            </VStack>
        </Box>
    );
};

export default MetadataExtractor; 