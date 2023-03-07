import React from "react";
import styled from "styled-components";
import { white100 } from "@/const/style";

const Wrapper = styled.div`
  color: ${white100};
  line-height: 1;
  padding: 14px 20px;
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
  background: rgba(0, 0, 0, 0.8);
`;

const SnackBar = () => <Wrapper>スナックバー サンプル</Wrapper>;

export default SnackBar;
