import React from "react";
import { MdDelete, MdOutlineClose } from "react-icons/md";
import styled from "styled-components";

const Wrapper = styled.div`
  display: flex;
  gap: 10px;
`;

const Left = styled.nav`
  line-height: 1;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const IconWrapper = styled.div`
  &:hover {
    color: #c00;
  }
`;

const Content = styled.div`
  flex-grow: 1;
`;

interface ClosableProps {
  children: React.ReactNode;
  onClose: () => void;
  onDelete?: () => void;
}

const Closable = ({ children, onClose, onDelete }: ClosableProps) => (
  <Wrapper>
    <Left>
      <IconWrapper>
        <MdOutlineClose onClick={onClose} />
      </IconWrapper>
      {onDelete && (
        <IconWrapper>
          <MdDelete onClick={onDelete} />
        </IconWrapper>
      )}
    </Left>
    <Content>{children}</Content>
  </Wrapper>
);

export default Closable;
