export const environment = {
  production: false,
  baseUrl: 'https://api.bdy.innovimpactdev.cloud/api',
  ALLOWED_ORIGINS: "https://bdy.innovimpactdev.cloud,https://bdy1.innovimpactdev.cloud",
filesUrl: 'https://minio.innovimpactdev.cloud/baye-defal-yalla',
  touchpay: {
    agencyCode: 'INIMA27104',
    token: 'idZnfqdG2BZxmKsHRLnQI5ZYY5vESgsNtPcYypZy8Bm72FQcxe',
    serviceId: 'https://innovimpactafrica.com/',
    successUrl: 'https://bdy.innovimpactdev.cloud/donor/dons?payment=success',
    failedUrl: 'https://bdy.innovimpactdev.cloud/donor/dons?payment=failed',
  },
};
