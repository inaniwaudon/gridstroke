import styled from "styled-components";

export const List = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  gap: 4px;
`;

export const Item = styled.li<{ selected: boolean }>`
  width: 24px;
  height: 24px;
  cursor: pointer;
  transform: scale(${(props) => (props.selected ? 1.2 : 0.8)});
  transition: transform 0.2s;
`;

export const Circle = styled.div<{ color: string }>`
  width: 100%;
  height: 100%;
  line-height: 22px;
  color: #fff;
  text-align: center;
  border-radius: 50%;
  background: ${(props) => props.color};
`;

export const PlusCircle = styled(Circle)`
  color: #666;
  text-shadow: unset;
`;
