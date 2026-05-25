import React from 'react';
import { Search, Trash2, Sparkles, RotateCcw, ThumbsUp } from 'lucide-react';
import ScheduleChart from './ScheduleChart';

export default function ItinerarySidebar({
  cart,
  setCart,
  searchQuery,
  setSearchQuery,
  isOptimized,
  optimizedSchedule,
  activeDayTab,
  setActiveDayTab,
  handleOptimizeSchedule,
  handleResetSchedule,
  selectedPlace,
  setSelectedPlace,
  startPlaceName
}) {
  const handleRemoveFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;
    const newCart = [...cart];
    const temp = newCart[index];
    newCart[index] = newCart[index - 1];
    newCart[index - 1] = temp;
    setCart(newCart);
  };

  const handleMoveDown = (index) => {
    if (index === cart.length - 1) return;
    const newCart = [...cart];
    const temp = newCart[index];
    newCart[index] = newCart[index + 1];
    newCart[index + 1] = temp;
    setCart(newCart);
  };

  const hotelCount = cart.filter(item => item.category === 'hotel').length;

  return (
    <div className="glass" style={{
      width: '400px',
      height: '100%',
      zIndex: 80,
      borderLeft: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '-10px 0 30px rgba(45, 55, 72, 0.04)'
    }}>
      {isOptimized ? (
        // ==================== [MODE A] 최적화 결과 일정표 타임라인 ====================
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{
                background: 'var(--primary-light)',
                color: 'var(--primary)',
                fontSize: '11px',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <Sparkles size={11} /> AI 최적 경로 완성
              </span>
              <button 
                onClick={handleResetSchedule}
                style={{
                  color: 'var(--text-muted)',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: 600
                }}
                className="interactive"
              >
                <RotateCcw size={13} /> 일정 재설정
              </button>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 800 }}>🗺️ 추천 상세 일정표</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              지정해주신 시작지를 기점으로 최적화한 순서입니다.
            </p>
          </div>

          {/* 일차별 탭 바 */}
          <div style={{
            display: 'flex',
            background: '#f7ebe7',
            padding: '6px',
            borderRadius: 'var(--radius-md)',
            margin: '16px 24px 8px 24px'
          }}>
            {Object.keys(optimizedSchedule).map(dayKey => (
              <button
                key={dayKey}
                onClick={() => setActiveDayTab(dayKey)}
                style={{
                  flex: 1,
                  padding: '8px 0',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '13px',
                  fontWeight: 700,
                  textAlign: 'center',
                  color: activeDayTab === dayKey ? 'white' : 'var(--primary)',
                  backgroundColor: activeDayTab === dayKey ? 'var(--primary)' : 'transparent',
                  transition: 'var(--transition-fast)'
                }}
              >
                {dayKey}
              </button>
            ))}
          </div>

          {/* D3.js 기반 여정 시간 분배 분석 도넛 차트 주입 */}
          <div style={{ padding: '0 24px' }}>
            <ScheduleChart dayPlaces={optimizedSchedule[activeDayTab] || []} />
          </div>

          {/* 수직 타임라인 피드 */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
            {(optimizedSchedule[activeDayTab] || []).map((place, idx) => {
              const isStartNode = place.id === 'start-landmark-node';
              const color = 
                isStartNode ? '#2d3748' :
                place.category === 'tourist' ? 'var(--secondary)' : 
                place.category === 'restaurant' ? 'var(--primary)' : 
                place.category === 'cafe' ? 'var(--accent-dark)' : '#718096';

              return (
                <div key={place.id} style={{ display: 'flex', gap: '16px', position: 'relative', paddingBottom: '24px' }}>
                  {idx !== (optimizedSchedule[activeDayTab].length - 1) && (
                    <div style={{
                      position: 'absolute',
                      left: '15px',
                      top: '32px',
                      bottom: 0,
                      width: '2px',
                      background: 'var(--border)'
                    }}></div>
                  )}

                  <div style={{
                    background: color,
                    color: 'white',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: isStartNode ? '10px' : '13px',
                    fontFamily: 'Outfit',
                  }}>
                    {idx + 1}
                  </div>

                  <div 
                    className="glass" 
                    onClick={() => { if (!isStartNode) setSelectedPlace(place); }}
                    style={{
                      flex: 1,
                      padding: '14px 16px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                      cursor: isStartNode ? 'default' : 'pointer',
                      background: selectedPlace?.id === place.id ? 'var(--bg-surface)' : 'var(--bg-glass)',
                      boxShadow: selectedPlace?.id === place.id ? 'var(--shadow-md)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: color, fontFamily: 'Outfit', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        ⏰ {place.timeSlot}
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>({place.duration})</span>
                    </div>
                    
                    <h4 style={{ fontSize: '13px', fontWeight: 700, marginTop: '4px', color: 'var(--text-main)' }}>{place.name}</h4>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', lineBreak: 'anywhere' }}>
                      {isStartNode ? '🏁 설정하신 여행 시작점' : 
                       place.category === 'tourist' ? '🏞️ 관광 명소' : 
                       place.category === 'restaurant' ? '🍽️ 식당' : 
                       place.category === 'cafe' ? '☕ 카페' : '🏨 숙소'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div style={{ padding: '20px 24px', background: 'var(--secondary-light)', textAlign: 'center', borderTop: '1px solid var(--border)' }}>
            <p style={{ color: 'var(--secondary)', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <ThumbsUp size={14} /> 안전하고 행복한 동반 여행 되세요!
            </p>
          </div>
        </div>
      ) : (
        // ==================== [MODE B] 장소 관심 목록 수집 장바구니 ====================
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>🧳 관심 일정 담기</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              출발지: {startPlaceName}
            </p>

            {/* 장소 검색바 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(0,0,0,0.02)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              marginTop: '16px',
              border: '1px solid var(--border)'
            }}>
              <Search size={16} color="var(--text-muted)" />
              <input 
                type="text" 
                placeholder="매장 명칭, 동네 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  width: '100%',
                  fontSize: '13px',
                  fontWeight: 500
                }}
              />
            </div>
          </div>

          {/* 장바구니 리스트 */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
            {cart.length === 0 ? (
              <div style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                textAlign: 'center',
                gap: '12px'
              }}>
                <div style={{ 
                  background: 'var(--primary-light)', 
                  color: 'var(--primary)', 
                  width: '56px', 
                  height: '56px', 
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px'
                }}>🦴</div>
                <div>
                  <h4 style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '14px' }}>담은 장소가 비어있습니다.</h4>
                  <p style={{ fontSize: '11px', marginTop: '4px', lineHeight: '1.5' }}>
                    지도 위 핀이나 하단 목록 카드를 눌러<br/>반려견 동반 명소/식당들을 담아주세요.
                  </p>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                
                {/* 단일 숙소 연박 지정 꿀팁 배너 */}
                {hotelCount === 1 && (
                  <div style={{
                    background: '#fdf2e9',
                    border: '1px solid #f8c4b4',
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px 14px',
                    fontSize: '11px',
                    color: 'var(--text-main)',
                    lineHeight: '1.5',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    <span style={{ fontSize: '14px' }}>💡</span>
                    <div>
                      <strong>숙소 연박 모드 작동!</strong> 숙소를 1개만 담으셨기 때문에 모든 일차(Day 1 ~ Day N)의 마지막 숙소로 연박 자동 지정됩니다.
                    </div>
                  </div>
                )}

                {/* 숙소 다중 선택 시 연박 안내 배너 */}
                {hotelCount > 1 && (
                  <div style={{
                    background: '#fff9e6',
                    border: '1px solid #ffe399',
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px 14px',
                    fontSize: '11px',
                    color: 'var(--text-main)',
                    lineHeight: '1.5',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    <span style={{ fontSize: '14px' }}>🏨</span>
                    <div>
                      <strong>연박 꿀팁:</strong> 현재 숙소를 여러 개 골라 일차별로 나뉘어 배정됩니다. <strong>단 하나의 숙소로 전 일정 연박</strong>을 원하시면 숙소를 1개만 담아주세요!
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
                    담은 장소 ({cart.length}개)
                  </span>
                  <button 
                    onClick={() => setCart([])}
                    style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 600 }}
                  >
                    전체 비우기
                  </button>
                </div>

                {cart.map((item, index) => (
                  <div 
                    key={item.id}
                    className="glass"
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px'
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ 
                        fontSize: '13px', 
                        fontWeight: 700, 
                        color: 'var(--text-main)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'inline-block', maxWidth: item.category === 'hotel' && hotelCount === 1 ? '160px' : '230px' }}>
                          {item.name}
                        </span>
                        {item.category === 'hotel' && hotelCount === 1 && (
                          <span style={{
                            background: 'var(--primary)',
                            color: 'white',
                            fontSize: '9px',
                            fontWeight: 800,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            whiteSpace: 'nowrap',
                            flexShrink: 0
                          }}>
                            🏨 연박 숙소
                          </span>
                        )}
                      </h4>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        {item.category === 'tourist' ? '🏞️ 관광 명소' : 
                         item.category === 'restaurant' ? '🍽️ 식당' : 
                         item.category === 'cafe' ? '☕ 카페' : '🏨 숙소'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <button 
                        disabled={index === 0}
                        onClick={() => handleMoveUp(index)}
                        style={{
                          padding: '4px',
                          color: index === 0 ? '#cbd5e0' : 'var(--text-muted)',
                          cursor: index === 0 ? 'not-allowed' : 'pointer',
                          fontSize: '11px'
                        }}
                      >
                        ▲
                      </button>
                      <button 
                        disabled={index === cart.length - 1}
                        onClick={() => handleMoveDown(index)}
                        style={{
                          padding: '4px',
                          color: index === cart.length - 1 ? '#cbd5e0' : 'var(--text-muted)',
                          cursor: index === cart.length - 1 ? 'not-allowed' : 'pointer',
                          fontSize: '11px'
                        }}
                      >
                        ▼
                      </button>
                      <button 
                        onClick={() => handleRemoveFromCart(item.id)}
                        style={{ padding: '6px', color: '#e53e3e', display: 'flex', alignItems: 'center' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI 최적화 동선 생성 버튼 */}
          <div style={{ padding: '20px 24px', borderTop: '1px solid var(--border)' }}>
            <button
              disabled={cart.length === 0}
              onClick={handleOptimizeSchedule}
              style={{
                width: '100%',
                background: cart.length === 0 ? '#cbd5e0' : 'linear-gradient(135deg, var(--primary) 0%, #d4684a 100%)',
                color: 'white',
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                fontWeight: 700,
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
                boxShadow: cart.length === 0 ? 'none' : '0 6px 20px rgba(224, 122, 95, 0.35)',
                transition: 'var(--transition-fast)'
              }}
            >
              <Sparkles size={16} />
              <span>AI 최적 동선 생성</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
