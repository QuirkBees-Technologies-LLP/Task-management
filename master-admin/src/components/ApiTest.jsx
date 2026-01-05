import React, { useState } from 'react';
import { Button, Card, message } from 'antd';
import api from '../services/api';

const ApiTest = () => {
  const [testResult, setTestResult] = useState('');

  const testConnection = async () => {
    try {
      const response = await api.get('/health');
      setTestResult(`✅ Connection successful! Server response: ${response.data.message}`);
      message.success('Backend connection successful!');
    } catch (error) {
      setTestResult(`❌ Connection failed: ${error.message}`);
      message.error('Backend connection failed!');
    }
  };

  return (
    <Card title="API Connection Test" style={{ marginBottom: '20px' }}>
      <Button type="primary" onClick={testConnection}>
        Test Backend Connection
      </Button>
      {testResult && (
        <div style={{ marginTop: 10, padding: 10, backgroundColor: '#f5f5f5' }}>
          {testResult}
        </div>
      )}
    </Card>
  );
};

export default ApiTest;
