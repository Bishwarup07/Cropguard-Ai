import { Router, type IRouter } from "express";
import { GetCurrentWeatherResponse } from "@workspace/api-zod";

const router: IRouter = Router();

const OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast";

function isValidCoordinate(value: number, min: number, max: number): boolean {
  return Number.isFinite(value) && value >= min && value <= max;
}

// Maps WMO Weather codes to a descriptive condition string and conditionType
function mapWeatherCode(code: number): { description: string; conditionType: string } {
  if (code === 0) return { description: "Clear sky", conditionType: "CLEAR" };
  if (code >= 1 && code <= 3) return { description: "Partly cloudy", conditionType: "CLOUDY" };
  if (code === 45 || code === 48) return { description: "Fog", conditionType: "FOG" };
  if ((code >= 51 && code <= 55) || (code >= 56 && code <= 57)) return { description: "Drizzle", conditionType: "RAIN" };
  if ((code >= 61 && code <= 65) || (code >= 66 && code <= 67)) return { description: "Rain", conditionType: "RAIN" };
  if (code >= 71 && code <= 77) return { description: "Snow", conditionType: "SNOW" };
  if (code >= 80 && code <= 82) return { description: "Rain showers", conditionType: "RAIN" };
  if (code >= 85 && code <= 86) return { description: "Snow showers", conditionType: "SNOW" };
  if (code >= 95 && code <= 99) return { description: "Thunderstorm", conditionType: "THUNDERSTORM" };
  
  return { description: "Unknown", conditionType: "UNKNOWN" };
}

router.get("/weather", async (req, res) => {
  const latitude = Number(req.query.latitude);
  const longitude = Number(req.query.longitude);

  if (!isValidCoordinate(latitude, -90, 90) || !isValidCoordinate(longitude, -180, 180)) {
    res.status(400).json({ message: "Valid latitude and longitude are required." });
    return;
  }

  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m",
    timezone: "auto"
  });

  try {
    const response = await fetch(`${OPEN_METEO_URL}?${params.toString()}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      res.status(502).json({ message: "Weather API could not return conditions." });
      return;
    }

    const payload = await response.json() as any;
    const current = payload.current || {};
    
    const weatherInfo = mapWeatherCode(current.weather_code);

    const data = GetCurrentWeatherResponse.parse({
      temperatureC: Number(current.temperature_2m) || 0,
      feelsLikeC: Number(current.apparent_temperature) || 0,
      description: weatherInfo.description,
      conditionType: weatherInfo.conditionType,
      iconBaseUri: "", // Open-Meteo doesn't provide base URIs natively, client can map conditionType to icons
      humidity: Number(current.relative_humidity_2m) || 0,
      precipitationProbability: Number(current.precipitation) > 0 ? 100 : 0, // Simplified as Open-Meteo current doesn't have exact probability
      windSpeedKph: Number(current.wind_speed_10m) || 0,
      observedAt: current.time ? new Date(current.time).toISOString() : new Date().toISOString(),
      timeZone: payload.timezone || "UTC",
    });

    res.json(data);
  } catch (error) {
    res.status(502).json({ message: "Weather service is temporarily unavailable." });
  }
});

export default router;