import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    AlertTriangle,
    CheckCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from "@/components/ui/use-toast";
import { Badge } from '@/components/ui/badge';
import authService from '@/services/authService';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface User {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    isVerified: boolean;
    subscription: string;
    credits: number;
    createdAt: string;
    totalSearches: number;
}

interface UsersApiResponse {
    users: User[];
    totalUsers: number;
    totalPages: number;
    currentPage: number;
}

const UsersPage: React.FC = () => {
    const [usersData, setUsersData] = useState<UsersApiResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const { toast } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setLoading(true);
                const response = await authService.getUsers(page);
                setUsersData(response as UsersApiResponse);
            } catch (error) {
                console.error('Error fetching users:', error);
                toast({
                    title: "Error",
                    description: "Failed to load users",
                    variant: "destructive"
                });
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [page, toast]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    const handleUserClick = (userId: string) => {
        navigate(`/admin/users/${userId}`);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Users</CardTitle>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <p>Loading users...</p>
                ) : !usersData ? (
                    <p>No user data found.</p>
                ) : (
                    <>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Subscription</TableHead>
                                    <TableHead>Credits</TableHead>
                                    <TableHead>Verified</TableHead>
                                    <TableHead>Searches</TableHead>
                                    <TableHead>Joined</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {usersData?.users.map(user => (
                                    <TableRow key={user._id}>
                                        <TableCell>{user.firstName} {user.lastName}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>
                                            <Badge>{user.subscription}</Badge>
                                        </TableCell>
                                        <TableCell>{user.credits}</TableCell>
                                        <TableCell>
                                            {user.isVerified ? (
                                                <CheckCircle className="h-5 w-5 text-green-500" />
                                            ) : (
                                                <AlertTriangle className="h-5 w-5 text-red-500" />
                                            )}
                                        </TableCell>
                                        <TableCell>{user.totalSearches}</TableCell>
                                        <TableCell>{formatDate(user.createdAt)}</TableCell>
                                        <TableCell>
                                            <Button variant="outline" size="sm" onClick={() => handleUserClick(user._id)}>
                                                View
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <Pagination className="mt-4">
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        href="#"
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        className={page === 1 ? 'pointer-events-none opacity-50' : undefined}
                                    />
                                </PaginationItem>
                                {[...Array(usersData.totalPages)].map((_, i) => (
                                    <PaginationItem key={i}>
                                        <PaginationLink href="#" onClick={() => setPage(i + 1)} isActive={page === i + 1}>
                                            {i + 1}
                                        </PaginationLink>
                                    </PaginationItem>
                                ))}
                                <PaginationItem>
                                    <PaginationNext
                                        href="#"
                                        onClick={() => setPage(p => Math.min(usersData.totalPages || 1, p + 1))}
                                        className={page === usersData.totalPages ? 'pointer-events-none opacity-50' : undefined}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </>
                )}
            </CardContent>
        </Card>
    );
};

export default UsersPage; 