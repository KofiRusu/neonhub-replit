export interface GeoPerformance {
  country: string;
  countryCode: string;
  impressions: number;
  clicks: number;
  ctr: number;
  avgPosition: number;
}

export async function fetchGeoPerformance({
  contentId,
  organizationId,
  dateRange,
}: {
  contentId?: string;
  organizationId: string;
  dateRange: { start: Date; end: Date };
}): Promise<GeoPerformance[]> {
  const mockData: GeoPerformance[] = [
    {
      country: "United States",
      countryCode: "US",
      impressions: 10000,
      clicks: 500,
      ctr: 5.0,
      avgPosition: 8.5,
    },
    {
      country: "United Kingdom",
      countryCode: "GB",
      impressions: 3000,
      clicks: 180,
      ctr: 6.0,
      avgPosition: 6.2,
    },
    {
      country: "Canada",
      countryCode: "CA",
      impressions: 2000,
      clicks: 100,
      ctr: 5.0,
      avgPosition: 9.1,
    },
  ];

  return mockData;
}

