import React from 'react';
import { Dialog } from '@headlessui/react';
import { IoMdClose } from 'react-icons/io';

import Modal from 'components/Modal';
import { HiOutlineTicket } from 'react-icons/hi';
import Voucher from './Voucher';
import { useQuery } from 'react-query';

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

interface IVouchersModalProps {
  isVisible: boolean;
  onClose: () => void;
}

interface IMilestone {
  milestoneCode: number;
  thresholdLoyaltyScore: number;
  milestoneDesc: string;
  milestoneTitle: string;
}

export const VouchersModal: React.FC<IVouchersModalProps> = ({
  isVisible,
  onClose,
}) => {
  const { isLoading, data: vouchersData } = useQuery(
    'vouchers',
    () =>
      fetch(
        'https://17eb-2405-204-8083-c73a-583a-287a-fc3a-2304.ngrok.io/api/v1/data/milestone-list',
      ).then(res => res.json()),
    {
      enabled: isVisible,
    },
  );
  const { milestoneList } = vouchersData ?? {};

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
            {isLoading ? (
              <section className="flex h-40 items-start justify-center pt-12">
                <svg
                  role="status"
                  className="mr-4 h-6 w-6 animate-spin fill-hyphen-purple text-gray-200"
                  viewBox="0 0 100 101"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                    fill="currentColor"
                  />
                  <path
                    d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                    fill="currentFill"
                  />
                </svg>
                <span className="text-hyphen-gray-400">
                  Getting those awesome vouchers.
                </span>
              </section>
            ) : null}

            {!isLoading && milestoneList && milestoneList.length === 0 ? (
              <section className="flex h-40 items-start justify-center pt-12">
                🥹
                <span className="ml-2 text-hyphen-gray-400">
                  You haven't unlocked any vouchers.
                </span>
              </section>
            ) : null}

            {milestoneList && milestoneList.length > 0
              ? milestoneList.map((milestone: IMilestone) => (
                  <Voucher
                    key={milestone.milestoneCode}
                    id={milestone.milestoneCode}
                    title={milestone.milestoneTitle}
                    description={milestone.milestoneDesc}
                    redeem={handleRedeem}
                  />
                ))
              : null}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default VouchersModal;
