// Plan type definition
export type PlanKey = 'free' | 'esencial' | 'pro' | 'prime';

// Plan configurations
export const PLANS: Record<PlanKey, {
  name: string;
  price: number;
  priceMonthly: number;
  priceAnnual: number;
  interval: string;
  features: string[];
  limits: {
    projectsPerMonth: number;
    simulationsPerMonth: number;
  };
}> = {
  free: {
    name: 'Free',
    price: 0,
    priceMonthly: 0,
    priceAnnual: 0,
    interval: 'forever',
    features: [
      'Browse all projects',
      'View project details',
      'Basic ROI calculator',
      'Community support',
      'Investment tracking',
    ],
    limits: {
      projectsPerMonth: 10,
      simulationsPerMonth: 5,
    },
  },
  esencial: {
    name: 'Esencial',
    price: 49000,
    priceMonthly: 49000,
    priceAnnual: 49000, // 15-day plan, no annual option
    interval: '15 días',
    features: [
      'Acceso completo al listado de remates',
      'Programar alertas personalizadas',
      'Guardar tus remates favoritos',
    ],
    limits: {
      projectsPerMonth: -1, // Unlimited
      simulationsPerMonth: 5,
    },
  },
  pro: {
    name: 'Pro',
    price: 98000,
    priceMonthly: 98000,
    priceAnnual: 823200, // 30% discount
    interval: 'mes',
    features: [
      'Todo lo del plan Esencial',
      'Evaluador de inversiones',
      '1 Masterclass mensual con expertos',
      'Top 2 oportunidades de la semana',
    ],
    limits: {
      projectsPerMonth: -1, // Unlimited
      simulationsPerMonth: -1, // Unlimited
    },
  },
  prime: {
    name: 'Prime',
    price: 139000,
    priceMonthly: 139000,
    priceAnnual: 1167600, // 30% discount
    interval: 'mes',
    features: [
      'Todo lo del plan Esencial',
      'Evaluador de inversiones',
      '2 Masterclass mensuales',
      'Top 3 oportunidades de la semana',
      '1 consultoría mensual con nuestro equipo experto',
    ],
    limits: {
      projectsPerMonth: -1, // Unlimited
      simulationsPerMonth: -1, // Unlimited
    },
  },
};
