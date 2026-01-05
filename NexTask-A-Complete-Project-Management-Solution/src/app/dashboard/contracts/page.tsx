'use client';
import React, { useEffect, useState } from 'react';
import { Button, Chip, Paper, Stack, useMediaQuery, useTheme } from '@mui/material';
import ContractDetails from './components/ContractDetails';
import ContractForm from './components/ContractForm';
import PageHeader from '@/components/PageHeader';
import { Contract } from './types';
import { mockData } from '@/utils/constants';
import ResponsiveTable from '@/components/Table';
import { contractColumns, getContractStatusColor } from './helpers';

export default function Contracts() {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContract, setSelectedContract] = useState<Contract | undefined>(undefined);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);

  useEffect(() => {
    setContracts(mockData.contracts);
  }, []);

  const handleAddContract = () => {
    setSelectedContract(undefined);
    setIsFormOpen(true);
  };

  const handleViewContract = (contractId?: string | number) => {
    const contract = contracts.find((c) => c.id === contractId);
    setSelectedContract(contract || undefined);
    setOpen(true);
  };

  const handleSaveContract = () => {
    setIsFormOpen(false);
  };

  return (
    <>
      <PageHeader
        title="Contracts"
        action={
          <Button onClick={handleAddContract} variant="contained" color="primary">
            Add Contract
          </Button>
        }
      />

      <Paper sx={{ p: isSmallScreen ? 2 : 0 }}>
        <ResponsiveTable
          columns={contractColumns}
          data={contracts}
          listKeys={{
            primaryKeys: ['title', 'budget'],
            secondaryKeys: ['client', 'startDate', 'endDate'],
          }}
          renderActions={(item: Contract) => (
            <>
              {isSmallScreen ? (
                <Stack alignItems={'end'}>
                  <Button onClick={() => handleViewContract(item.id)}>View</Button>
                  <Chip label={item.status} color={getContractStatusColor(item.status)} />
                </Stack>
              ) : (
                <Button onClick={() => handleViewContract(item.id)}>View</Button>
              )}
            </>
          )}
        />
      </Paper>

      <ContractDetails open={open} onClose={() => setOpen(false)} contract={selectedContract} />

      <ContractForm
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveContract}
        initialContract={selectedContract}
      />
    </>
  );
}
