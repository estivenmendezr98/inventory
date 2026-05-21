import { create } from 'zustand';
import {
  applyCompanyFavicon,
  companyLogoUrl,
  fetchPublicBranding,
  type BrandingInfo,
} from '../lib/company-branding';

interface CompanyBrandingState {
  branding: BrandingInfo;
  loaded: boolean;
  logoSrc: string | null;
  load: () => Promise<void>;
  setBranding: (branding: BrandingInfo) => void;
}

const empty: BrandingInfo = { hasLogo: false, updatedAt: null, mimeType: null };

export const useCompanyBrandingStore = create<CompanyBrandingState>((set) => ({
  branding: empty,
  loaded: false,
  logoSrc: null,

  setBranding: (branding) => {
    applyCompanyFavicon(branding);
    set({
      branding,
      logoSrc: branding.hasLogo ? companyLogoUrl(branding.updatedAt) : null,
      loaded: true,
    });
  },

  load: async () => {
    try {
      const branding = await fetchPublicBranding();
      applyCompanyFavicon(branding);
      set({
        branding,
        logoSrc: branding.hasLogo ? companyLogoUrl(branding.updatedAt) : null,
        loaded: true,
      });
    } catch {
      set({ branding: empty, logoSrc: null, loaded: true });
    }
  },
}));
