import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Default branding values (CLONEFY defaults)
const DEFAULT_BRANDING = {
  logoLightUrl: '/lovable-uploads/fbe6c7af-7d70-474d-af99-5f513f7a14dc.png',
  logoDarkUrl: '/lovable-uploads/8f2944d9-660f-4eb7-bae6-e226176b6a6d.png',
  logoIconUrl: '/lovable-uploads/59070bb1-9779-4bbb-a3d5-a65bacf38b70.png',
  primaryColor: null as string | null,
  accentColor: null as string | null,
  companyName: 'CLONEFY',
  isActive: false,
};

interface UserBranding {
  id?: string;
  user_id?: string;
  logo_light_url?: string | null;
  logo_dark_url?: string | null;
  logo_icon_url?: string | null;
  primary_color?: string | null;
  accent_color?: string | null;
  company_name?: string | null;
  is_active?: boolean;
}

interface BrandingContextType {
  logoLightUrl: string;
  logoDarkUrl: string;
  logoIconUrl: string;
  primaryColor: string | null;
  accentColor: string | null;
  companyName: string;
  isActive: boolean;
  isLoading: boolean;
  updateBranding: (branding: Partial<UserBranding>) => Promise<void>;
  resetBranding: () => Promise<void>;
  refetchBranding: () => Promise<void>;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

// Helper function to convert HEX to HSL
const hexToHsl = (hex: string): string | null => {
  // Remove # if present
  hex = hex.replace(/^#/, '');
  
  if (!/^[0-9A-Fa-f]{6}$/.test(hex)) {
    return null;
  }

  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

// Apply colors to CSS custom properties
const applyColors = (primaryColor: string | null, accentColor: string | null) => {
  const root = document.documentElement;
  
  if (primaryColor) {
    // Check if it's HEX and convert to HSL
    const hslColor = primaryColor.startsWith('#') ? hexToHsl(primaryColor) : primaryColor;
    if (hslColor) {
      root.style.setProperty('--primary', hslColor);
      root.style.setProperty('--primary-glow', hslColor);
    }
  } else {
    // Reset to default
    root.style.removeProperty('--primary');
    root.style.removeProperty('--primary-glow');
  }
  
  if (accentColor) {
    const hslColor = accentColor.startsWith('#') ? hexToHsl(accentColor) : accentColor;
    if (hslColor) {
      root.style.setProperty('--accent', hslColor);
    }
  } else {
    root.style.removeProperty('--accent');
  }
};

export const BrandingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [branding, setBranding] = useState(DEFAULT_BRANDING);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Fetch branding from database
  const fetchBranding = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setBranding(DEFAULT_BRANDING);
        applyColors(null, null);
        setIsLoading(false);
        return;
      }
      
      setUserId(user.id);
      
      const { data, error } = await supabase
        .from('user_branding')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching branding:', error);
        setBranding(DEFAULT_BRANDING);
        applyColors(null, null);
        setIsLoading(false);
        return;
      }
      
      if (data && data.is_active) {
        const newBranding = {
          logoLightUrl: data.logo_light_url || DEFAULT_BRANDING.logoLightUrl,
          logoDarkUrl: data.logo_dark_url || DEFAULT_BRANDING.logoDarkUrl,
          logoIconUrl: data.logo_icon_url || DEFAULT_BRANDING.logoIconUrl,
          primaryColor: data.primary_color,
          accentColor: data.accent_color,
          companyName: data.company_name || DEFAULT_BRANDING.companyName,
          isActive: data.is_active ?? false,
        };
        setBranding(newBranding);
        applyColors(data.primary_color, data.accent_color);
      } else {
        setBranding(DEFAULT_BRANDING);
        applyColors(null, null);
      }
    } catch (error) {
      console.error('Error in fetchBranding:', error);
      setBranding(DEFAULT_BRANDING);
      applyColors(null, null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update branding in database
  const updateBranding = useCallback(async (newBranding: Partial<UserBranding>) => {
    if (!userId) return;
    
    try {
      // Check if record exists
      const { data: existing } = await supabase
        .from('user_branding')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
      
      const brandingData = {
        user_id: userId,
        logo_light_url: newBranding.logo_light_url,
        logo_dark_url: newBranding.logo_dark_url,
        logo_icon_url: newBranding.logo_icon_url,
        primary_color: newBranding.primary_color,
        accent_color: newBranding.accent_color,
        company_name: newBranding.company_name,
        is_active: newBranding.is_active ?? true,
        updated_at: new Date().toISOString(),
      };
      
      if (existing) {
        const { error } = await supabase
          .from('user_branding')
          .update(brandingData)
          .eq('user_id', userId);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_branding')
          .insert(brandingData);
        
        if (error) throw error;
      }
      
      // Refetch to update state
      await fetchBranding();
    } catch (error) {
      console.error('Error updating branding:', error);
      throw error;
    }
  }, [userId, fetchBranding]);

  // Reset branding to defaults
  const resetBranding = useCallback(async () => {
    if (!userId) return;
    
    try {
      const { error } = await supabase
        .from('user_branding')
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);
      
      if (error) throw error;
      
      setBranding(DEFAULT_BRANDING);
      applyColors(null, null);
    } catch (error) {
      console.error('Error resetting branding:', error);
      throw error;
    }
  }, [userId]);

  // Listen for auth changes
  useEffect(() => {
    fetchBranding();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        fetchBranding();
      } else if (event === 'SIGNED_OUT') {
        setBranding(DEFAULT_BRANDING);
        applyColors(null, null);
        setUserId(null);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [fetchBranding]);

  return (
    <BrandingContext.Provider
      value={{
        ...branding,
        isLoading,
        updateBranding,
        resetBranding,
        refetchBranding: fetchBranding,
      }}
    >
      {children}
    </BrandingContext.Provider>
  );
};

export const useBranding = (): BrandingContextType => {
  const context = useContext(BrandingContext);
  if (context === undefined) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
};
