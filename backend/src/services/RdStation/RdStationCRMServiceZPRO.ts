import axios, { AxiosInstance } from 'axios';

interface Contact {
  // Defina a interface do contato conforme necessário
  id?: string;
  name?: string;
  email?: string;
  // ... outros campos
}

const rdstationAPI: AxiosInstance = axios.create({
  baseURL: 'https://crm.rdstation.com/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});

export const getContacts = async (token: string): Promise<Contact[]> => {
  try {
    const response = await rdstationAPI.get(`/contacts?token=${token}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching contacts:', error);
    throw new Error('Failed to fetch contacts');
  }
};

export const createContact = async (token: string, contactData: Partial<Contact>): Promise<Contact> => {
  try {
    const response = await rdstationAPI.post(`/contacts?token=${token}`, contactData);
    return response.data;
  } catch (error) {
    console.error('Error creating contact:', error);
    throw new Error('Failed to create contact');
  }
};

export const updateContact = async (
  token: string, 
  contactId: string, 
  contactData: Partial<Contact>
): Promise<Contact> => {
  try {
    const response = await rdstationAPI.put(
      `/contacts/${contactId}?token=${token}`, 
      contactData
    );
    return response.data;
  } catch (error) {
    console.error('Error updating contact:', error);
    throw new Error('Failed to update contact');
  }
};

export const deleteContact = async (token: string, contactId: string): Promise<void> => {
  try {
    const response = await rdstationAPI.delete(`/contacts/${contactId}?token=${token}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting contact:', error);
    throw new Error('Failed to delete contact');
  }
}; 