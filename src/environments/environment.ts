export const environment = {
  production: false,
  baseUrl: 'https://api.bdy.innovimpactdev.cloud/api',
  ALLOWED_ORIGINS: "https://bdy.innovimpactdev.cloud,https://bdy1.innovimpactdev.cloud",
filesUrl: 'https://minio.innovimpactdev.cloud/baye-defal-yalla',
  touchpay: {
    agencyCode: 'SOLI26685',
    token: 'SJeOJiLKfP2FUHWgTEzhX8Y0km36CwGkbJQTKdplZM3QORfQ6m',
    serviceId: 'solimus.net',
    successUrl: 'https://bdy.innovimpactdev.cloud/donor/dons?payment=success',
    failedUrl: 'https://bdy.innovimpactdev.cloud/donor/dons?payment=failed',
  },
};
