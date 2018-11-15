import React from "react";
import { Button, Buttons, Flex, Type } from "blockstack-ui/dist";
import { Modal } from "@components/modal";
import { Label } from "@components/field";
import { Value } from "@components/stacks";
import { TypeIcon } from "@components/transaction-item";
import { StaticField } from "@components/field";

const TxAmounts = ({ amount, ...rest }) => (
  <Flex py={4} px={6} flexDirection="column" justifyContent="center">
    <Label>Amount</Label>
    <Flex>
      <Value fontSize={6} amount={amount} micro suffix="STX" />
    </Flex>
    <Label pt={4} pb={0}>
      Fees
    </Label>
    <Value fontSize={2} fontWeight={500} amount={amount} suffix="BTC" micro />
  </Flex>
);

const OperationTypeSection = ({ operation, ...rest }) => (
  <Flex
    alignItems="center"
    justifyContent="center"
    flexDirection="column"
    py={4}
    px={6}
    flexShrink={0}
    borderRight={1}
    borderColor="blue.mid"
    alignSelf={"stretch"}
  >
    <TypeIcon mb={2} size={72} type={operation} />
    <Label pb={0}>{operation === "SENT" ? "Sent" : "Received"}</Label>
    <Label pb={0}>Stacks</Label>
  </Flex>
);

const TxDetailsModal = ({ hide, visible, tx, ...rest }) => {
  const {
    sender,
    block_id,
    txid,
    consensusHash,
    valueStacks,
    value: amount,
    scratchData,
    recipientBitcoinAddress,
    recipient,
    operation
  } = tx;

  const items = [{ label: "Sender", value: sender }, { label: "Recipient (Stacks)", value: recipient }, { label: "BTC Transaction", value: txid }, { label: "BTC Block", value: block_id }, { label: "Memo", value: scratchData }];
  return (
    <Modal title="Transaction Details" hide={hide} p={0}>
      <Flex
        p={4}
        borderBottom={1}
        borderColor="blue.mid"
        bg="blue.light"
        alignItems="center"
        flexShrink={0}
      >
        <Flex
          width={1}
          bg="white"
          borderRadius={6}
          border={1}
          borderColor="blue.mid"
          alignItems="center"
          flexShrink={0}
        >
          <OperationTypeSection operation={operation} />
          <TxAmounts amount={amount} />
        </Flex>
      </Flex>
      <Flex flexDirection="column" p={4} flexShrink={0}>
        {items.map(
          ({ label, value }, i) =>
            value && value !== "" ? (
              <StaticField key={i} label={label} value={value} />
            ) : null
        )}
        <Buttons>
          <Button onClick={hide}>Close</Button>
        </Buttons>
      </Flex>
    </Modal>
  );
};

export { TxDetailsModal };