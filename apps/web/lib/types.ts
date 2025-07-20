// API Error Response type
export interface ApiError {
  error?: string;
  message?: string;
  errors?: Array<{
    field?: string;
    message: string;
  }>;
}

// Axios Error with typed response
export interface AxiosErrorWithResponse extends Error {
  response?: {
    data: ApiError;
    status: number;
    statusText: string;
  };
  request?: any;
  config?: any;
}