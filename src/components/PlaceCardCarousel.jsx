import React from 'react';
import { Plus, Check, Clock } from 'lucide-react';

export default function PlaceCardCarousel({
  filteredPlaces,
  selectedPlace,
  setSelectedPlace,
  cart,
  handleToggleCart,
  selectedCategory,
  setSelectedCategory,
}) {
  return (
    <div
      className="place-carousel-container"
      style={{
        position: 'absolute',
        bottom: '24px',
        left: '24px',
        right: '24px',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        pointerEvents: 'none',
      }}
    >
      {/* 1. 카테고리 필터 칩 바 */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '4px',
          pointerEvents: 'auto',
        }}
      >
        {[
          { id: 'all', label: '전체 보기', icon: '🐾' },
          { id: 'tourist', label: '관광지 🏞️', icon: '🏞️' },
          { id: 'restaurant', label: '식당 🍽️', icon: '🍽️' },
          { id: 'cafe', label: '카페 ☕', icon: '☕' },
          { id: 'hotel', label: '숙소 🏠', icon: '🏠' },
        ].map((chip) => (
          <button
            key={chip.id}
            onClick={() => setSelectedCategory(chip.id)}
            className="glass interactive"
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-full)',
              fontSize: '13px',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              color:
                selectedCategory === chip.id ? 'white' : 'var(--text-main)',
              background:
                selectedCategory === chip.id
                  ? 'var(--primary)'
                  : 'var(--bg-glass)',
              border:
                selectedCategory === chip.id
                  ? '1px solid var(--primary)'
                  : '1px solid rgba(255,255,255,0.5)',
            }}
          >
            <span style={{ marginRight: '6px' }}>{chip.icon}</span>
            {chip.label}
          </button>
        ))}
      </div>

      {/* 2. 가로 스크롤 카드 슬라이더 */}
      <div
        style={{
          display: 'flex',
          gap: '16px',
          overflowX: 'auto',
          padding: '4px 4px 12px 4px',
          scrollbarWidth: 'none',
          pointerEvents: 'auto',
        }}
      >
        {filteredPlaces.length === 0 ? (
          <div
            className="glass"
            style={{
              padding: '24px',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              color: 'var(--text-muted)',
              flex: 1,
              textAlign: 'center',
            }}
          >
            선택된 지역 및 카테고리에 해당하는 동반 장소가 없습니다.
          </div>
        ) : (
          filteredPlaces.map((place) => {
            const isInCart = cart.some((item) => item.id === place.id);
            const tagColor =
              place.category === 'tourist'
                ? 'var(--secondary-light)'
                : place.category === 'restaurant'
                  ? 'var(--primary-light)'
                  : place.category === 'cafe'
                    ? '#fdf6e2'
                    : '#f0eae1';

            const tagTextColor =
              place.category === 'tourist'
                ? 'var(--secondary)'
                : place.category === 'restaurant'
                  ? 'var(--primary)'
                  : place.category === 'cafe'
                    ? 'var(--accent-dark)'
                    : 'var(--text-muted)';

            return (
              <div
                key={place.id}
                className="glass interactive place-card-item"
                onClick={() => setSelectedPlace(place)}
                style={{
                  flex: '0 0 280px',
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  border:
                    selectedPlace?.id === place.id
                      ? '2.5px solid var(--primary)'
                      : '1px solid rgba(255,255,255,0.6)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '140px',
                  boxShadow:
                    selectedPlace?.id === place.id
                      ? 'var(--shadow-lg)'
                      : 'var(--shadow-sm)',
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      backgroundColor: tagColor,
                      color: tagTextColor,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      display: 'inline-block',
                      marginBottom: '8px',
                    }}
                  >
                    {place.category === 'tourist'
                      ? '명소'
                      : place.category === 'restaurant'
                        ? '식당'
                        : place.category === 'cafe'
                          ? '카페'
                          : '숙소'}
                  </span>

                  <h3
                    style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      marginBottom: '4px',
                      color: 'var(--text-main)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {place.name}
                  </h3>
                  <p
                    style={{
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {place.address}
                  </p>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '12px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px',
                    }}
                  >
                    <Clock size={11} /> {place.open_hours}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleCart(place);
                    }}
                    style={{
                      background: isInCart
                        ? 'var(--secondary)'
                        : 'var(--primary)',
                      color: 'white',
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '11px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    {isInCart ? <Check size={12} /> : <Plus size={12} />}
                    {isInCart ? '담김' : '담기'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
