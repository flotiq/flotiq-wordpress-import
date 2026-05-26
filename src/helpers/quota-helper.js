export const isQuotaError = (error) => {
    return (
        error.response?.status === 403 ||
        error.response?.data?.error?.includes('quota') ||
        error.response?.data?.message?.includes('quota') ||
        error.message?.includes('quota') ||
        error.message?.includes('status code 403') ||
        JSON.stringify(error).includes('quota')
    );
};
