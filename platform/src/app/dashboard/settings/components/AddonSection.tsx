
import React, { useState, useEffect } from 'react';
import { 
    Box, 
    Typography, 
    Button, 
    Card, 
    CardContent, 
    CardActions, 
    Grid, 
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    CircularProgress,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Snackbar
} from '@mui/material';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import { useRouter } from 'next/navigation';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface AddonPlan {
    _id: string;
    plan_name: string;
    description: string;
    price: {
        monthly: number | null;
        yearly: number | null;
    };
    users_allowed: number | null;
    billing_period: string[];
    type: 'add-on';
}

interface Organization {
    _id: string;
    addons?: Array<{
        planId: string;
        planName?: string; // May need to fetch if not stored
        status: string;
        purchaseDate: string;
        current_period_end?: string;
    }>;
}

export default function SubscriptionSettings({ organization }: { organization: any }) {
    const [addonPlans, setAddonPlans] = useState<AddonPlan[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [purchasing, setPurchasing] = useState<string | null>(null); // Plan ID being purchased
    const router = useRouter();

    // Fetch available Addon Plans
    // Since public API excludes them, we might need a verified endpoint or just use a specific query params if allowed?
    // Actually, we modified /api/plans to exclude them. So we need a new endpoint or pass a param `includeAddons=true`.
    // Let's assume we create a new internal endpoint or use /api/plans?type=add-on if we modify it.
    // For now, I will modify /api/plans to accept type=add-on query param for authenticated users or create a new simple fetcher.
    // Let's implement a direct fetch here assuming we fix the API or use a verified route. 
    // Wait, I blocked them in public API. I should probably create `GET /api/addons` or just use `GET /api/plans?type=add-on` and adjust the route.
    // I will adjust the route in next step.

    useEffect(() => {
        const fetchAddons = async () => {
             try {
                 // We will need to update GET /api/plans to allow fetching addons via param
                 const res = await axios.get('/api/plans?type=add-on'); 
                 if (res.data.success) {
                     setAddonPlans(res.data.plans);
                 }
             } catch (err) {
                 console.error("Failed to fetch addons", err);
                 // Fallback or silent fail
             }
        };
        fetchAddons();
    }, []);

    const handleBuyAddon = async (plan: AddonPlan, billingPeriod: 'monthly' | 'yearly') => {
        setPurchasing(plan._id);
        setError('');
        try {
            const { data } = await axios.post('/api/stripe/checkout/addon', {
                planId: plan._id,
                billingPeriod,
            });

            if (data.url) {
                window.location.href = data.url;
            } else {
                setError('Failed to start checkout');
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Checkout failed');
            setPurchasing(null);
        }
    };

    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [addonToCancel, setAddonToCancel] = useState<any>(null);
    const [cancelLoading, setCancelLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    const handleCancelClick = (addon: any) => {
        setAddonToCancel(addon);
        setCancelDialogOpen(true);
    };

    const confirmCancel = async () => {
        if (!addonToCancel || !addonToCancel.subscriptionId) {
             setError('Invalid subscription ID. Cannot cancel.');
             setCancelDialogOpen(false);
             return;
        }

        setCancelLoading(true);
        try {
            await axios.delete(`/api/stripe/subscription?subscriptionId=${addonToCancel.subscriptionId}`);
            setSuccessMsg('Add-on subscription cancelled successfully. It will remain active until the end of the billing period.');
            setCancelDialogOpen(false);
            setAddonToCancel(null);
            router.refresh(); 
        } catch (err: any) {
             console.error('Cancellation failed', err);
             setError(err.response?.data?.error || 'Failed to cancel subscription');
             setCancelDialogOpen(false);
        } finally {
             setCancelLoading(false);
        }
    };

    const handleCloseSnackbar = () => setSuccessMsg('');

    // This is just a draft of the Addon section to be merged.
    
    return (
        <Box sx={{ mt: 4 }} id="addon-plans">
            <Typography variant="h6" gutterBottom>Add-ons</Typography>
            
            {/* List Active Addons */}
            {organization?.addons && organization.addons.length > 0 ? (
                <TableContainer component={Paper} variant="outlined" sx={{ mb: 4 }}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Plan</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell align="right">Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {organization.addons.map((addon: any, index: number) => (
                                <TableRow key={index}>
                                    <TableCell>
                                        {/* We might need to look up plan name if not stored. For now assume ID or basic info */}
                                        Add-on Plan ({addonPlans?.find((plan: any) => plan._id === addon.planId)?.plan_name ?? "N/A"})
                                    </TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={addon.status} 
                                            color={addon.status === 'active' ? 'success' : 'default'} 
                                            size="small" 
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Button 
                                            size="small" 
                                            color="error" 
                                            onClick={() => handleCancelClick(addon)}
                                            disabled={addon.status === 'canceled'}
                                        >
                                            {addon.status === 'canceled' ? 'Cancelled' : 'Cancel'}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            ) : (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    No active add-ons.
                </Typography>
            )}

            <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>Available Add-ons</Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            
            <Grid container spacing={2}>
                {addonPlans.map((plan) => (
                    <Grid item xs={12} md={6} lg={4} key={plan._id}>
                        <Card variant="outlined">
                            <CardContent>
                                <Typography variant="h6">{plan.plan_name}</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    {plan.description}
                                </Typography>
                                <Typography variant="h5">
                                    {plan.price.monthly && `$${plan.price.monthly}/mo`}
                                    {plan.price.monthly && plan.price.yearly && ' or '}
                                    {plan.price.yearly && `$${plan.price.yearly}/yr`}
                                </Typography>
                                <Typography variant="body2" sx={{ mt: 1 }}>
                                    +{plan.users_allowed} Users
                                </Typography>
                            </CardContent>
                            <CardActions>
                                {plan.price.monthly && (
                                    <Button 
                                        variant="contained" 
                                        size="small"
                                        disabled={!!purchasing}
                                        onClick={() => handleBuyAddon(plan, 'monthly')}
                                    >
                                        Buy Monthly
                                    </Button>
                                )}
                                {plan.price.yearly && (
                                    <Button 
                                        variant="outlined" 
                                        size="small"
                                        disabled={!!purchasing}
                                        onClick={() => handleBuyAddon(plan, 'yearly')}
                                    >
                                        Buy Yearly
                                    </Button>
                                )}
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Cancel Dialog */}
            <Dialog
                open={cancelDialogOpen}
                onClose={() => !cancelLoading && setCancelDialogOpen(false)}
            >
                <DialogTitle>Cancel Add-on Subscription</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to cancel this add-on plan? 
                        <br /><br />
                        Your access will continue until the end of the current billing period, after which it will be deactivated.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCancelDialogOpen(false)} disabled={cancelLoading}>
                        Go Back
                    </Button>
                    <Button onClick={confirmCancel} color="error" variant="contained" disabled={cancelLoading} autoFocus>
                        {cancelLoading ? <CircularProgress size={24} color="inherit" /> : 'Confirm Cancellation'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={!!successMsg} autoHideDuration={6000} onClose={handleCloseSnackbar}>
                <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
                    {successMsg}
                </Alert>
            </Snackbar>
        </Box>
    );
}
