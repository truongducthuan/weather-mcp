import React from 'react';
import { useWidgetProps, useWidgetState } from '@fractal-mcp/oai-hooks';
import type { WeatherWidgetProps } from '../types/weather.types';

export default function WeatherWidget() {
  const props = useWidgetProps<WeatherWidgetProps & Record<string, unknown>>();
  const [state, setState] = useWidgetState({ 
    unit: 'celsius' as 'celsius' | 'fahrenheit',
    showHistory: true
  });

  const { current, history, message } = props;

  const convertTemp = (celsius: number): number => {
    return state.unit === 'celsius' 
      ? celsius 
      : Math.round((celsius * 9/5) + 32);
  };

  const getWeatherEmoji = (description: string): string => {
    if (description.includes('nắng')) return '☀️';
    if (description.includes('mưa')) return '🌧️';
    if (description.includes('mây')) return '☁️';
    return '🌤️';
  };

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      maxWidth: '600px',
      margin: '0 auto',
      padding: '24px',
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ 
          margin: '0 0 8px 0',
          fontSize: '28px',
          fontWeight: '700',
          color: '#1a1a1a',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          🌤️ Weather Dashboard
        </h2>
        <p style={{ 
          margin: 0,
          fontSize: '14px',
          color: '#666'
        }}>
          {message}
        </p>
      </div>

      {/* Current Weather Card */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '12px',
        padding: '24px',
        color: 'white',
        marginBottom: '24px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '16px'
        }}>
          <div>
            <h3 style={{
              margin: '0 0 4px 0',
              fontSize: '32px',
              fontWeight: '600'
            }}>
              {current.city}
            </h3>
            <p style={{
              margin: 0,
              fontSize: '16px',
              opacity: 0.9
            }}>
              {current.country} • {new Date(current.timestamp).toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
          
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontSize: '56px',
              fontWeight: '700',
              lineHeight: '1'
            }}>
              {convertTemp(current.temperature)}°
            </div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>
              Cảm giác {convertTemp(current.feelsLike)}°
            </div>
          </div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '18px',
          marginBottom: '20px'
        }}>
          <span>{getWeatherEmoji(current.description)}</span>
          <span>{current.description}</span>
        </div>

        {/* Weather Details Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px',
          paddingTop: '16px',
          borderTop: '1px solid rgba(255,255,255,0.2)'
        }}>
          <div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>Độ ẩm</div>
            <div style={{ fontSize: '20px', fontWeight: '600' }}>
              💧 {current.humidity}%
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>Gió</div>
            <div style={{ fontSize: '20px', fontWeight: '600' }}>
              💨 {current.windSpeed} km/h
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>Áp suất</div>
            <div style={{ fontSize: '20px', fontWeight: '600' }}>
              🌡️ {current.pressure} hPa
            </div>
          </div>
        </div>
      </div>

      {/* Unit Toggle */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px'
      }}>
        <button
          onClick={() => setState({ ...state, unit: 'celsius' })}
          style={{
            flex: 1,
            padding: '12px',
            border: 'none',
            borderRadius: '8px',
            backgroundColor: state.unit === 'celsius' ? '#667eea' : '#f3f4f6',
            color: state.unit === 'celsius' ? 'white' : '#666',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          °C (Celsius)
        </button>
        <button
          onClick={() => setState({ ...state, unit: 'fahrenheit' })}
          style={{
            flex: 1,
            padding: '12px',
            border: 'none',
            borderRadius: '8px',
            backgroundColor: state.unit === 'fahrenheit' ? '#667eea' : '#f3f4f6',
            color: state.unit === 'fahrenheit' ? 'white' : '#666',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          °F (Fahrenheit)
        </button>
      </div>

      {/* Search History */}
      {history.length > 0 && (
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px'
          }}>
            <h4 style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: '600',
              color: '#1a1a1a'
            }}>
              📊 Lịch sử tìm kiếm
            </h4>
            <button
              onClick={() => setState({ ...state, showHistory: !state.showHistory })}
              style={{
                padding: '6px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                backgroundColor: 'white',
                color: '#666',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              {state.showHistory ? '👁️ Ẩn' : '👁️ Hiện'}
            </button>
          </div>

          {state.showHistory && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              {history.slice().reverse().map((item, index) => (
                <div
                  key={index}
                  style={{
                    padding: '12px 16px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#1a1a1a'
                    }}>
                      {item.city}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#666'
                    }}>
                      {new Date(item.searchTime).toLocaleString('vi-VN')}
                    </div>
                  </div>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#667eea'
                  }}>
                    {convertTemp(item.temperature)}°{state.unit === 'celsius' ? 'C' : 'F'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer Tip */}
      <div style={{
        marginTop: '24px',
        padding: '12px 16px',
        backgroundColor: '#eff6ff',
        borderRadius: '8px',
        border: '1px solid #dbeafe',
        fontSize: '13px',
        color: '#1e40af'
      }}>
        💡 <strong>Mẹo:</strong> Hỏi ChatGPT "Thời tiết ở [tên thành phố]" để xem dự báo!
      </div>
    </div>
  );
}