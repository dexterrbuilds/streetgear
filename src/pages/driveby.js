import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import Papa from 'papaparse';
import '../App.css';

// Solana wallet imports
import {
  ConnectionProvider,
  WalletProvider,
  useWallet,
} from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import {
  WalletModalProvider,
  WalletMultiButton,
} from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl, Transaction, Connection } from '@solana/web3.js';
import '@solana/wallet-adapter-react-ui/styles.css';
import { Buffer } from 'buffer';

const WalletConnectionStatus = () => {
  const { publicKey, connected, signTransaction } = useWallet();
  const [recipientsInput, setRecipientsInput] = useState('');
  const [recipients, setRecipients] = useState([]);
  const [token, setToken] = useState('SOL');
  const [tokenMint, setTokenMint] = useState('');
  const [balance, setBalance] = useState(null);
  const [message, setMessage] = useState('');
  const [tokens, setTokens] = useState([]);  // New state for SPL tokens

  const connection = useMemo(() => new Connection('https://api.mainnet-beta.solana.com', 'confirmed'), []);

  useEffect(() => {
    const fetchBalance = async () => {
      if (publicKey) {
        try {
          const response = await axios.post('https://solms-backend.onrender.com/balance', {
            publicKey: publicKey.toString(),
          });
          setBalance(response.data.balance);
        } catch (error) {
          console.error('Error fetching balance:', error);
          setMessage('Error fetching balance');
        }
      }
    };

    const fetchTokens = async () => {
      if (publicKey && token === 'SPL') {
        try {
          const response = await axios.post('https://solms-backend.onrender.com/tokens', {
            publicKey: publicKey.toString(),
          });
          setTokens(response.data.tokens);  // Set fetched tokens
        } catch (error) {
          console.error('Error fetching tokens:', error);
          setMessage('Error fetching tokens');
        }
      }
    };

    if (connected) {
      fetchBalance();
      fetchTokens();  // Fetch tokens when connected
    }
  }, [publicKey, connected, token]);

  useEffect(() => {
    if (recipientsInput) {
      const rows = recipientsInput
        .split('\n')
        .map(row => row.trim())
        .filter(row => row);
      const parsedRecipients = rows.map(row => {
        const [address, amount] = row.split(',').map(item => item.trim());
        return { address, amount: parseFloat(amount) };
      });
      setRecipients(parsedRecipients);
    }
  }, [recipientsInput]);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    Papa.parse(file, {
      complete: (result) => {
        const csvData = result.data;
        const parsedRecipients = csvData.map(row => {
          const [address, amount] = row;
          return { address, amount: parseFloat(amount) };
        });
        setRecipients(parsedRecipients);
      },
      error: (err) => {
        console.error('CSV parsing error:', err);
        setMessage('Error parsing CSV file');
      },
      header: false,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
  
    if (!publicKey) {
      setMessage('Wallet is not connected or publicKey is not available.');
      return;
    }
  
    try {
      const payload = {
        recipients,
        publicKey: publicKey.toString(),
        token: token !== 'SOL' ? tokenMint : 'SOL', // Pass the selected token mint for SPL token
      };
  
      // Log the payload to the console
      console.log('Payload:', payload);
  
      // Send request to backend to prepare the transaction
      const response = await axios.post('https://solms-backend.onrender.com/send', payload);
  
      if (response.data && response.data.success) {
        const transactionBase64 = response.data.transaction;
  
        // Deserialize the transaction in frontend
        const transaction = Transaction.from(Buffer.from(transactionBase64, 'base64'));
  
        // Sign the transaction using the wallet
        const signedTransaction = await signTransaction(transaction);
  
        // Send the signed transaction to the backend for submission
        const submitResponse = await axios.post('https://solms-backend.onrender.com/submit', {
          signedTransaction: signedTransaction.serialize().toString('base64'),
        });
  
        if (submitResponse.data.success) {
          setMessage(`Transaction confirmed: ${submitResponse.data.signature}`);
        } else {
          setMessage(`Error: ${submitResponse.data.error}`);
          console.error(`Backend Error: ${submitResponse.data.error}`);
        }
      } else {
        setMessage(`Error: ${response.data.error}`);
        console.error(`Backend Error: ${response.data.error}`);
      }
    } catch (error) {
      console.error('Submit error:', error);
      setMessage(`Error: ${error.response ? error.response.data : error.message}`);
    }
  };
  
  

  return (
    <div className="App">
      <h1>senderr</h1>

      <WalletMultiButton />

      <div className="wallet-status">
        {publicKey ? (
          <>
            <p>Wallet Public Key: {publicKey.toString()}</p>
            {balance !== null && <p>Balance: {balance} SOL</p>}
          </>
        ) : (
          <p>Wallet is not connected</p>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div>
          <label>
            <div>Token Type</div>
            <select value={token} onChange={(e) => setToken(e.target.value)}>
              <option value="SOL">SOL</option>
              <option value="SPL">SPL Token</option>
            </select>
          </label>
        </div>

        {token === 'SPL' && (
          <div>
            <label>
              <div>Select SPL Token</div>
              <select value={tokenMint} onChange={(e) => setTokenMint(e.target.value)}>
                <option value="">-- Select Token --</option>
                {tokens.map((t) => (
                  <option key={t.mint} value={t.mint}>
                    {t.mint} - {t.amount}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        <div>
          <label>
            <div>Recipients (address, amount)</div>
            <textarea
              value={recipientsInput}
              onChange={(e) => setRecipientsInput(e.target.value)}
              placeholder="Enter recipients in the format: address, amount"
              rows="5"
              cols="50"
            />
          </label>
        </div>

        <div>
          <label>
            <div>Upload CSV</div>
            <input type="file" accept=".csv" onChange={handleFileUpload} />
          </label>
        </div>

        <div className="btns">
          <button type="submit">Send</button>
        </div>
      </form>

      {message && <p className="message">{message}</p>}
    </div>
  );
};

const Driveby = () => {
  const network = WalletAdapterNetwork.Mainnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  const wallets = useMemo(
    () => [
      new SolflareWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <WalletConnectionStatus />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default Driveby;
