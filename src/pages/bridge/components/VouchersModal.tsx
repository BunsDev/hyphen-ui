import React from 'react';
import { Dialog } from '@headlessui/react';
import { IoMdClose } from 'react-icons/io';

import Modal from 'components/Modal';
import { HiOutlineTicket } from 'react-icons/hi';
import Voucher from './Voucher';

const vouchers = [
  {
    id: 0,
    title: 'Free Transaction',
    description:
      'We wont charge you for your next transaction, the transaction fee will be on us. Enjoy the ride!',
  },
  {
    id: 1,
    title: 'Biconomy Merchendise',
    description:
      'Get an awesome Biconomy tee shirt and wear it with swag. Support us in our quest to make Web3 better!',
  },
  {
    id: 2,
    title: 'Biconomy Merchendise x2',
    description:
      'Get an awesome Biconomy tee shirt along with a water bottle. Much chill such swag!',
  },
  {
    id: 3,
    title: 'Game Night',
    description:
      'Chill with the Biconomy team during one of their game nights. Chat, have fun and have a jolly good time!',
  },
  {
    id: 4,
    title: 'Request a Feature',
    description:
      'Have a say in what feature you want Hyphen to implement next, make those ideas come to life!',
  },
];

export interface IVouchersModalProps {
  isVisible: boolean;
  onClose: () => void;
}

export const VouchersModal: React.FC<IVouchersModalProps> = ({
  isVisible,
  onClose,
}) => {
  function handleRedeem(id: number) {
    console.log(id);
  }

  return (
    <Modal isVisible={isVisible} onClose={onClose}>
      <div className="relative rounded-3xl bg-white p-6 shadow-2xl">
        <div className="absolute -inset-2 -z-10 rounded-3xl bg-white/60 opacity-50 blur-lg"></div>
        <div className="flex flex-col">
          <div className="mb-6 flex items-center justify-between">
            <Dialog.Title
              as="h1"
              className="p-2 text-xl font-semibold text-black text-opacity-[0.54]"
            >
              Vouchers
            </Dialog.Title>
            <button onClick={onClose} className="rounded hover:bg-gray-100">
              <IoMdClose className="h-6 w-auto text-gray-500" />
            </button>
          </div>
          <div className="grid max-h-96 grid-cols-1 gap-2 overflow-auto">
            {vouchers.map(voucher => (
              <Voucher
                key={voucher.id}
                id={voucher.id}
                title={voucher.title}
                description={voucher.description}
                redeem={handleRedeem}
              />
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default VouchersModal;
