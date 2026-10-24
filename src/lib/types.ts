/**
 * Shared domain types for the Fortal Tech backoffice + storefront.
 * These mirror the Supabase schema defined in `schema.sql`.
 */

export interface Notebook {
  id: string;
  model: string;
  specs: string;
  price: number;
  image_url: string;
  gallery_urls?: string[] | null;
  is_promotional: boolean;
  is_sold: boolean;
  sold_at?: string | null;
  created_at?: string;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  icon_name: string;
  tags: string[] | null;
  order_index: number;
}

export interface Contact {
  id: string;
  name: string;
  whatsapp: string;
  service_type: string;
  message: string;
  status: string;
  created_at: string;
}

export type SiteContent = Record<string, string>;

export type AdminTab = 'notebooks' | 'services' | 'content' | 'messages';

export interface ContactFormState {
  name: string;
  whatsapp: string;
  service_type: string;
  message: string;
}

export const EMPTY_CONTACT_FORM: ContactFormState = {
  name: '',
  whatsapp: '',
  service_type: 'Selecione um serviço',
  message: '',
};

export const DEFAULT_SITE_CONTENT: SiteContent = {
  hero_title: 'SEU PC COMO NOVO.',
  hero_description:
    'Manutenção preventiva, corretiva e upgrades de alta performance. Especialistas em notebooks e desktops gamer e office em Fortaleza.',
  whatsapp_number: '5585999910250',
  site_title: 'FORTAL TECH',
  visits: '1245',
  footer_text: '© 2024 Fortal Tech - Assistencia e Sistemas. Todos os direitos reservados.',
};
