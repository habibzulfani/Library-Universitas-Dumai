'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { authorsAPI } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

interface Author {
    name: string;
    bookCount: number;
    paperCount: number;
}

export default function AuthorsPage() {
    const [authors, setAuthors] = useState<Author[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        fetchAuthors();
    }, [searchQuery]);

    const fetchAuthors = async () => {
        try {
            setIsLoading(true);
            const response = await authorsAPI.searchAuthors(searchQuery);
            setAuthors(response.data.authors);
        } catch (error) {
            console.error('Error fetching authors:', error);
            toast({
                title: 'Error',
                description: 'Failed to fetch authors',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleAuthorClick = (authorName: string) => {
        router.push(`/authors/${encodeURIComponent(authorName)}`);
    };

    return (
        <div className="container mx-auto py-8">
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold">Authors</h1>
                    <div className="relative w-72">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search authors..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                </div>

                {isLoading ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {[...Array(6)].map((_, i) => (
                            <Card key={i} className="animate-pulse">
                                <CardHeader>
                                    <div className="h-6 w-3/4 bg-muted rounded" />
                                </CardHeader>
                                <CardContent>
                                    <div className="h-4 w-1/2 bg-muted rounded mb-2" />
                                    <div className="h-4 w-1/3 bg-muted rounded" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : authors.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">No authors found</p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {authors.map((author) => (
                            <Card key={author.name} className="hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <CardTitle className="text-xl">
                                        <Button
                                            className="p-0 h-auto text-xl font-bold text-primary hover:text-primary/90"
                                            onClick={() => handleAuthorClick(author.name)}
                                        >
                                            {author.name}
                                        </Button>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex gap-4 text-sm text-muted-foreground">
                                        <div>
                                            <span className="font-medium">{author.bookCount}</span> Books
                                        </div>
                                        <div>
                                            <span className="font-medium">{author.paperCount}</span> Papers
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
} 