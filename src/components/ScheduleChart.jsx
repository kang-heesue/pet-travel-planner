import React, { useEffect, useRef } from 'react';

/**
 * D3.js 기반으로 일차별 여정 정보(명소, 식당, 카페, 숙소 등) 비중과
 * 총 소요시간 분석을 직관적인 Donut Chart 그래프로 렌더링하는 시각화 컴포넌트입니다.
 */
export default function ScheduleChart({ dayPlaces }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!dayPlaces || dayPlaces.length === 0 || !window.d3) return;

    const d3 = window.d3;

    // 1. 카테고리별 시간 분배 및 라벨 계산
    const categoryMinutes = {
      '관광 명소': 0,
      식당: 0,
      카페: 0,
      숙소: 0,
    };

    dayPlaces.forEach((p) => {
      // 카테고리별 체류 시간 규정 매핑
      let mins = 90;
      if (p.category === 'landmark') mins = 40;
      if (p.category === 'tourist') mins = 120;
      if (p.category === 'cafe') mins = 60;
      if (p.category === 'hotel') mins = 180;

      let catLabel = '관광 명소';
      if (p.category === 'restaurant') catLabel = '식당';
      if (p.category === 'cafe') catLabel = '카페';
      if (p.category === 'hotel') catLabel = '숙소';

      categoryMinutes[catLabel] += mins;
    });

    const chartData = Object.keys(categoryMinutes)
      .map((key) => ({ label: key, value: categoryMinutes[key] }))
      .filter((d) => d.value > 0);

    if (chartData.length === 0) return;

    // SVG 크기 및 중심점 세팅
    const width = 140;
    const height = 140;
    const radius = Math.min(width, height) / 2;

    // 기존 요소 클리어
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3
      .select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    // 브랜드 테마(놀러가개) 웜톤 컬러 스케일
    const color = d3
      .scaleOrdinal()
      .domain(chartData.map((d) => d.label))
      .range(['#81b29a', '#e07a5f', '#f2cc8f', '#718096']); // Sage Green, Terracotta, Yellow, Gray

    const pie = d3
      .pie()
      .value((d) => d.value)
      .sort(null);

    const arc = d3
      .arc()
      .innerRadius(radius * 0.58)
      .outerRadius(radius * 0.9);

    const arcs = svg
      .selectAll('.arc')
      .data(pie(chartData))
      .enter()
      .append('g')
      .attr('class', 'arc');

    // 패스 드로잉 및 회전 애니메이션
    arcs
      .append('path')
      .attr('d', arc)
      .attr('fill', (d) => color(d.data.label))
      .attr('stroke', '#fff')
      .style('stroke-width', '2px')
      .style('cursor', 'pointer')
      .transition()
      .duration(700)
      .attrTween('d', function (d) {
        const i = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
        return function (t) {
          return arc(i(t));
        };
      });

    // 중앙 총 여정 소요시간 텍스트 배치
    svg
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-5px')
      .style('font-size', '9px')
      .style('font-weight', '700')
      .style('fill', 'var(--text-muted)')
      .text('소요 시간');

    const totalMins = d3.sum(chartData, (d) => d.value);
    const totalHours = (totalMins / 60).toFixed(1);

    svg
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '12px')
      .style('font-size', '13px')
      .style('font-weight', '850')
      .style('fill', 'var(--text-main)')
      .style('font-family', 'Outfit')
      .text(`${totalHours}h`);
  }, [dayPlaces]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        background: 'rgba(255,255,255,0.4)',
        padding: '12px 14px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border)',
        marginTop: '12px',
        marginBottom: '16px',
      }}
    >
      <svg ref={svgRef} style={{ flexShrink: 0 }}></svg>

      {/* 범례 및 소요 시간 상세 리포트 */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '5px',
        }}
      >
        <h4
          style={{
            fontSize: '11px',
            fontWeight: 800,
            color: 'var(--text-main)',
            marginBottom: '2px',
            letterSpacing: '-0.2px',
          }}
        >
          📊 여행 일정 분석
        </h4>
        {dayPlaces &&
          (() => {
            const counts = {
              tourist: 0,
              restaurant: 0,
              cafe: 0,
              hotel: 0,
              landmark: 0,
            };
            dayPlaces.forEach(
              (p) => (counts[p.category] = (counts[p.category] || 0) + 1),
            );

            const categories = [
              { key: 'tourist', label: '명소 🏞️', color: '#81b29a' },
              { key: 'restaurant', label: '식당 🍽️', color: '#e07a5f' },
              { key: 'cafe', label: '카페 ☕', color: '#f2cc8f' },
              { key: 'hotel', label: '숙소 🏨', color: '#718096' },
            ];

            return categories.map((cat) => {
              const count = counts[cat.key] || 0;
              if (count === 0) return null;
              return (
                <div
                  key={cat.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '10px',
                  }}
                >
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                    }}
                  >
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: cat.color,
                        display: 'inline-block',
                      }}
                    ></span>
                    {cat.label}
                  </span>
                  <span
                    style={{
                      fontWeight: 800,
                      color: 'var(--text-main)',
                      fontFamily: 'Outfit',
                    }}
                  >
                    {count}개 장소
                  </span>
                </div>
              );
            });
          })()}
      </div>
    </div>
  );
}
