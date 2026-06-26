export const environment = {
  production: false,
  baseUrl: '/api',
  ALLOWED_ORIGINS: "http://localhost:4200,http://localhost:3080",
  filesUrl: 'http://localhost:9000/baye-defal-yalla',
  touchpay: {
    agencyCode: 'INIMA27104',
    token: 'idZnfqdG2BZxmKsHRLnQI5ZYY5vESgsNtPcYypZy8Bm72FQcxe',
    serviceId: 'https://innovimpactafrica.com/',
    successUrl: 'http://localhost:4200/donor/dons?payment=success',
    failedUrl: 'http://localhost:4200/donor/dons?payment=failed',
  },
};
